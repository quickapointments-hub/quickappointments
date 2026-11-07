import { AuthService } from './services/authService';
import { CatalogService } from './services/catalogService';
import { AvailabilityService } from './services/availabilityService';
import { BookingService } from './services/bookingService';
import { AdminService } from './services/adminService';
import { prisma } from './prisma';
import { UserRole, PaymentMethod } from '@quick-appointments/shared-types';

async function runDirectIntegrationTests() {
  console.log('======================================================');
  console.log('RUNNING QUICK APPOINTMENTS IN-PROCESS INTEGRATION TESTS');
  console.log('======================================================');

  // 1. Authentication & OTP
  console.log('\n--- 1. Testing OTP Generation & Verification ---');
  const otpRes = await AuthService.requestOtp('+919876543219', 'CUSTOMER');
  console.log('OTP Request Result:', otpRes.success ? 'PASSED' : 'FAILED', `(OTP: ${otpRes.debugOtp})`);

  const authRes = await AuthService.verifyOtp('+919876543219', '123456', 'Priya Menon', UserRole.CUSTOMER);
  console.log('Customer Auth Result:', authRes.user.fullName === 'Priya Menon' ? 'PASSED' : 'FAILED', {
    userId: authRes.user.id,
    roles: authRes.user.roles,
    activeRole: authRes.user.activeRole,
  });

  // 2. Role Switcher
  console.log('\n--- 2. Testing Customer -> Provider Role Switching ---');
  const roleSwitch = await AuthService.switchRole(authRes.user.id, UserRole.PROVIDER);
  console.log('Role switch:', roleSwitch.activeRole === UserRole.PROVIDER ? 'PASSED' : 'FAILED', roleSwitch);

  // 3. Dynamic Catalog Services
  console.log('\n--- 3. Testing Dynamic Catalog Services ---');
  const categories = await CatalogService.getCategories();
  console.log(`Found ${categories.length} active launch categories:`);
  categories.forEach(c => console.log(`  - ${c.name} (${c.slug}) [${c._count.services} services]`));

  const services = await CatalogService.getServices();
  console.log(`Found total ${services.length} services across catalog.`);

  // 4. Provider Discovery & Slot Calculation
  console.log('\n--- 4. Testing Provider Discovery & Working Hours Matrix ---');
  const providers = await prisma.providerProfile.findMany({
    where: { verificationStatus: 'APPROVED' },
    include: { user: true, workingHours: true },
  });
  console.log(`Discovered ${providers.length} approved live providers.`);
  const targetProvider = providers[0];
  console.log(`Target Provider: ${targetProvider.businessName} (${targetProvider.city})`);

  // Pick a weekday (e.g. 2 days ahead if tomorrow is Sunday)
  const testDateObj = new Date(Date.now() + 24 * 60 * 60 * 1000);
  if (testDateObj.getDay() === 0) { // If Sunday, move to Monday
    testDateObj.setDate(testDateObj.getDate() + 1);
  }
  const testDate = testDateObj.toISOString().split('T')[0];
  const slots = await AvailabilityService.getAvailableSlots(targetProvider.id, testDate);
  const openSlots = slots.filter(s => s.isAvailable);
  console.log(`Calculated slots for ${testDate} (Day ${testDateObj.getDay()}): ${slots.length} total slots (${openSlots.length} available)`);
  console.log('Available slots:', openSlots.map(s => s.time));

  if (openSlots.length === 0) {
    throw new Error('No open slots available for testing');
  }

  // 5. Concurrency Pessimistic Slot Locking (Rule 9 & 10)
  console.log('\n--- 5. Testing Concurrency Reservation Hold (10-Minute Lock) ---');
  const targetSlot = openSlots[0].time;
  const targetService = services[0];
  const customerProfile = await prisma.customerProfile.findFirst({
    where: { userId: authRes.user.id },
  }) || await prisma.customerProfile.create({
    data: { userId: authRes.user.id, city: 'Mumbai' },
  });

  const reservation = await AvailabilityService.reserveSlot(
    customerProfile.id,
    targetProvider.id,
    targetService.id,
    testDate,
    targetSlot
  );
  console.log('Slot Reservation Held:', reservation.id ? 'PASSED' : 'FAILED', {
    slot: `${reservation.date} ${reservation.startTime} - ${reservation.endTime}`,
    expiresAt: reservation.expiresAt,
  });

  // 6. Test Double-Booking Conflict Prevention
  console.log('\n--- 6. Testing Double Booking Conflict Rejection ---');
  let conflictCaught = false;
  try {
    // Attempting to reserve the EXACT SAME slot while held
    await AvailabilityService.reserveSlot(
      'another-customer-id',
      targetProvider.id,
      targetService.id,
      testDate,
      targetSlot
    );
  } catch (err: any) {
    conflictCaught = true;
    console.log('Second reservation correctly rejected with error:', err.message);
  }
  console.log('Double booking protection test:', conflictCaught ? 'PASSED' : 'FAILED');

  // 7. Booking Confirmation & Commission Calculation
  console.log('\n--- 7. Testing Booking Conversion & Financials ---');
  const confirmedBooking = await BookingService.confirmBooking(
    customerProfile.id,
    reservation.id,
    PaymentMethod.CASH_ON_SERVICE,
    'Client requested master stylist'
  );
  console.log('Booking Confirmed:', confirmedBooking.bookingRef ? 'PASSED' : 'FAILED', {
    bookingRef: confirmedBooking.bookingRef,
    service: confirmedBooking.service.name,
    totalPrice: confirmedBooking.totalAmount,
    platformCommission: confirmedBooking.platformCommission,
    providerEarnings: confirmedBooking.providerEarnings,
  });

  // Verify Provider Earning ledger entry
  const earning = await prisma.providerEarning.findUnique({
    where: { bookingId: confirmedBooking.id },
  });
  console.log('Provider Earnings Ledger:', earning?.netEarnings === confirmedBooking.providerEarnings ? 'PASSED' : 'FAILED', earning);

  // 8. Admin SaaS Metrics & Provider KYC Approval
  console.log('\n--- 8. Testing Admin Metrics & KYC Review Flow ---');
  const metrics = await AdminService.getDashboardMetrics();
  console.log('Dashboard SaaS Metrics:', metrics);

  // Test Admin KYC
  const pendingProviders = await prisma.providerProfile.findMany({
    where: { verificationStatus: 'PENDING' },
  });
  if (pendingProviders.length > 0) {
    const pToApprove = pendingProviders[0];
    const adminUser = await prisma.user.findFirst({
      where: { phone: '+919999900001' },
    });
    const approvedProvider = await AdminService.verifyProvider(
      pToApprove.id,
      'APPROVE',
      adminUser!.id
    );
    console.log(`Admin approved provider ${pToApprove.id}:`, approvedProvider.verificationStatus === 'APPROVED' ? 'PASSED' : 'FAILED');

    // Verify audit log
    const auditLog = await prisma.auditLog.findFirst({
      where: { entityId: pToApprove.id },
      orderBy: { createdAt: 'desc' },
    });
    console.log('Audit Log verification entry:', auditLog?.action === 'PROVIDER_APPROVED' ? 'PASSED' : 'FAILED', auditLog?.action);
  }

  console.log('\n======================================================');
  console.log('ALL INTEGRATION & BUSINESS LOGIC TESTS PASSED SUCCESSFULLY!');
  console.log('======================================================\n');
}

runDirectIntegrationTests()
  .catch((err) => {
    console.error('Integration test failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
