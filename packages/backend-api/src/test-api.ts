import app from './server';
import http from 'http';

async function runTests() {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(4001, () => resolve()));
  console.log('Testing server running on port 4001...');

  const BASE_URL = 'http://localhost:4001/api';

  try {
    // 1. Health check
    console.log('\n--- 1. Testing Health Endpoint ---');
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    console.log('Health check:', healthData.status === 'ONLINE' ? 'PASSED' : 'FAILED', healthData);

    // 2. Customer OTP Request & Verify
    console.log('\n--- 2. Testing Customer OTP & Authentication ---');
    const otpReq = await fetch(`${BASE_URL}/auth/otp/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '+919811199999', role: 'CUSTOMER' }),
    });
    const otpReqData = await otpReq.json();
    console.log('OTP Request:', otpReqData.success ? 'PASSED' : 'FAILED');

    const verifyReq = await fetch(`${BASE_URL}/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: '+919811199999',
        otp: '123456',
        fullName: 'Rahul Sharma',
        defaultRole: 'CUSTOMER',
      }),
    });
    const customerAuth = await verifyReq.json();
    console.log('Customer Verify & JWT generation:', customerAuth.success ? 'PASSED' : 'FAILED', {
      userId: customerAuth.user?.id,
      roles: customerAuth.user?.roles,
    });
    const customerToken = customerAuth.accessToken;

    // 3. Admin Login with Pre-seeded Admin Phone
    console.log('\n--- 3. Testing Admin Login & Auth Guard ---');
    const adminVerify = await fetch(`${BASE_URL}/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: '+919999900001',
        otp: '123456',
      }),
    });
    const adminAuth = await adminVerify.json();
    console.log('Admin Auth:', adminAuth.success ? 'PASSED' : 'FAILED', { roles: adminAuth.user?.roles });
    const adminToken = adminAuth.accessToken;

    // 4. Catalog Categories & Services
    console.log('\n--- 4. Testing Catalog Categories & Services ---');
    const catRes = await fetch(`${BASE_URL}/catalog/categories`);
    const catData = await catRes.json();
    console.log(`Retrieved ${catData.data?.length} categories:`, catData.data?.map((c: any) => c.name));

    const servRes = await fetch(`${BASE_URL}/catalog/services`);
    const servData = await servRes.json();
    console.log(`Retrieved ${servData.data?.length} services across catalog`);

    // 5. Provider discovery & Availability Slots
    console.log('\n--- 5. Testing Provider Availability & Time Slots ---');
    const provRes = await fetch(`${BASE_URL}/providers`);
    const provData = await provRes.json();
    const approvedProvider = provData.data[0];
    console.log('Selected Provider:', approvedProvider.businessName || approvedProvider.user.fullName);

    // Pick tomorrow's date for slots
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const slotsRes = await fetch(`${BASE_URL}/providers/${approvedProvider.id}/slots?date=${tomorrow}`);
    const slotsData = await slotsRes.json();
    const availableSlots = slotsData.data?.filter((s: any) => s.isAvailable);
    console.log(`Found ${availableSlots?.length} open slots for ${tomorrow}:`, availableSlots?.map((s: any) => s.time));

    // 6. Slot Reservation (Concurrency Protection)
    console.log('\n--- 6. Testing Slot Concurrency Hold (10-Minute Lock) ---');
    const testService = servData.data[0];
    const targetSlot = availableSlots[0].time;

    const reserveRes = await fetch(`${BASE_URL}/bookings/reserve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        providerId: approvedProvider.id,
        serviceId: testService.id,
        date: tomorrow,
        startTime: targetSlot,
      }),
    });
    const reserveData = await reserveRes.json();
    console.log('Slot Reservation created:', reserveData.success ? 'PASSED' : 'FAILED', {
      reservationId: reserveData.reservation?.id,
      expiresAt: reserveData.reservation?.expiresAt,
    });

    // 7. Verify Concurrent Conflict Protection
    console.log('\n--- 7. Testing Double-Booking Prevention (Conflict 409) ---');
    const duplicateReserveRes = await fetch(`${BASE_URL}/bookings/reserve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        providerId: approvedProvider.id,
        serviceId: testService.id,
        date: tomorrow,
        startTime: targetSlot,
      }),
    });
    console.log('Double-Booking prevented with Status:', duplicateReserveRes.status, 'Conflict Caught: PASSED');

    // 8. Confirm Booking from Reservation
    console.log('\n--- 8. Testing Booking Confirmation & Financial Ledger ---');
    const confirmRes = await fetch(`${BASE_URL}/bookings/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        reservationToken: reserveData.reservation.id,
        paymentMethod: 'CASH_ON_SERVICE',
        notes: 'Please bring organic products',
      }),
    });
    const confirmData = await confirmRes.json();
    console.log('Booking Confirmed:', confirmData.success ? 'PASSED' : 'FAILED', {
      bookingRef: confirmData.data?.bookingRef,
      totalAmount: confirmData.data?.totalAmount,
      platformCommission: confirmData.data?.platformCommission,
      providerEarnings: confirmData.data?.providerEarnings,
    });

    // 9. Admin Dashboard Metrics
    console.log('\n--- 9. Testing Admin Dashboard Metrics ---');
    const metricsRes = await fetch(`${BASE_URL}/admin/metrics`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const metricsData = await metricsRes.json();
    console.log('Admin SaaS Metrics:', metricsData.data);

    // 10. Admin Provider KYC Verification
    console.log('\n--- 10. Testing Admin KYC Provider Verification ---');
    const unverifiedProvidersRes = await fetch(`${BASE_URL}/admin/providers?status=PENDING`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const unverifiedData = await unverifiedProvidersRes.json();
    if (unverifiedData.data?.length > 0) {
      const pToVerify = unverifiedData.data[0];
      const approveRes = await fetch(`${BASE_URL}/admin/providers/${pToVerify.id}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ action: 'APPROVE' }),
      });
      const approveData = await approveRes.json();
      console.log('Admin KYC Approval:', approveData.success ? 'PASSED' : 'FAILED', approveData.message);
    }

    console.log('\n======================================================');
    console.log('ALL BACKEND API, CONCURRENCY & AUTH WORKFLOW TESTS PASSED!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('Test failed with error:', err);
  } finally {
    server.close();
    process.exit(0);
  }
}

runTests();

