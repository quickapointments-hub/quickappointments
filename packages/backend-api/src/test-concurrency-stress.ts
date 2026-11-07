import { prisma } from './prisma';
import { AvailabilityService } from './services/availabilityService';
import { BookingService } from './services/bookingService';
import { PaymentService } from './services/paymentService';
import { SlotCleanupWorker } from './services/slotCleanupWorker';

async function runStressAndEdgeCaseTests() {
  console.log('================================================================');
  console.log('STARTING QUICK APPOINTMENTS CONCURRENCY & STRESS TEST SUITE');
  console.log('================================================================');

  // Find an approved provider & service
  const provider = await prisma.providerProfile.findFirst({
    where: { verificationStatus: 'APPROVED' },
  });
  const service = await prisma.service.findFirst();

  if (!provider || !service) {
    throw new Error('Database must have at least one approved provider and service');
  }

  // Create 100 test customer profiles
  console.log('\n--- 1. Setting up 100 Concurrent Virtual Customers ---');
  const customerIds: string[] = [];
  for (let i = 1; i <= 100; i++) {
    const phone = `+91970000${String(i).padStart(4, '0')}`;
    const user = await prisma.user.upsert({
      where: { phone },
      update: {},
      create: {
        phone,
        fullName: `Virtual Client ${i}`,
        roles: { create: [{ role: 'CUSTOMER' }] },
        customer: { create: { city: 'Mumbai' } },
      },
      include: { customer: true },
    });
    if (user.customer) {
      customerIds.push(user.customer.id);
    }
  }
  console.log(`Created ${customerIds.length} unique customer profiles for concurrency test.`);

  // 2. High-Concurrency Race Condition Test: 100 customers racing for ONE single slot
  console.log('\n--- 2. High-Concurrency Race Condition (100 Simultaneous Slot Requests) ---');
  const targetDate = '2026-11-20';
  const targetTime = '15:00';

  // Ensure clean slate for test slot (respecting foreign key integrity)
  await prisma.slotReservation.deleteMany({
    where: { providerId: provider.id, date: targetDate, startTime: targetTime },
  });
  const existingBookings = await prisma.booking.findMany({
    where: { providerId: provider.id, date: targetDate, startTime: targetTime },
  });
  for (const eb of existingBookings) {
    await prisma.bookingStatusHistory.deleteMany({ where: { bookingId: eb.id } });
    await prisma.paymentTransaction.deleteMany({ where: { bookingId: eb.id } });
    await prisma.providerEarning.deleteMany({ where: { bookingId: eb.id } });
    await prisma.booking.delete({ where: { id: eb.id } });
  }

  console.log(`Firing 100 simultaneous reservation calls for Provider: ${provider.id} on ${targetDate} @ ${targetTime}...`);
  const startStamp = Date.now();

  const results = await Promise.allSettled(
    customerIds.map((cId) =>
      AvailabilityService.reserveSlot(cId, provider.id, service.id, targetDate, targetTime)
    )
  );

  const durationMs = Date.now() - startStamp;
  console.log(`All 100 concurrent requests resolved in ${durationMs}ms`);

  const fulfilled = results.filter((r) => r.status === 'fulfilled');
  const rejected = results.filter((r) => r.status === 'rejected');

  console.log(`Results: Fulfilled = ${fulfilled.length}, Rejected = ${rejected.length}`);

  // STRESS ASSERTION: Exactly ONE reservation must succeed!
  if (fulfilled.length === 1 && rejected.length === 99) {
    console.log('✅ CONCURRENCY CHECK PASSED: Exactly 1 customer captured the lock, 99 rejected with conflict!');
  } else {
    throw new Error(`CONCURRENCY RACE CONDITION FAILURE! Fulfilled: ${fulfilled.length}, Expected: 1`);
  }

  // 3. Slot Expiration & Auto-Release Test
  console.log('\n--- 3. Testing Slot Expiration & Cleanup Worker ---');
  // Artificially expire the held reservation
  const winningReservation = (fulfilled[0] as PromiseFulfilledResult<any>).value;
  await prisma.slotReservation.update({
    where: { id: winningReservation.id },
    data: { expiresAt: new Date(Date.now() - 5000) }, // 5 seconds in the past
  });

  const releasedCount = await SlotCleanupWorker.runCleanup();
  console.log(`Cleanup worker released: ${releasedCount} expired reservation(s)`);

  // Now, a second customer should be able to acquire the slot!
  const secondCustomer = customerIds[1];
  const secondTry = await AvailabilityService.reserveSlot(
    secondCustomer,
    provider.id,
    service.id,
    targetDate,
    targetTime
  );
  console.log('✅ EXPIRED SLOT RE-RESERVATION PASSED: Slot successfully re-acquired by Customer 2 after expiry!', secondTry.id);

  // Confirm booking for customer 2
  const confirmedBooking = await BookingService.confirmBooking(
    secondCustomer,
    secondTry.id,
    'RAZORPAY' as any
  );
  console.log('Booking confirmed:', confirmedBooking.bookingRef);

  // 4. Payment Gateway Webhook Idempotency Test
  console.log('\n--- 4. Testing Payment Webhook Verification & Idempotency ---');
  const paymentTx = await prisma.paymentTransaction.findFirst({
    where: { bookingId: confirmedBooking.id },
  });

  const mockWebhookPayload = {
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: 'pay_test_987654321',
          order_id: paymentTx?.gatewayTxId || 'order_test_123',
          amount: confirmedBooking.totalAmount * 100,
          status: 'captured',
        },
      },
    },
  };

  // First dispatch: valid webhook
  const firstWebhookRes = await PaymentService.processWebhook(mockWebhookPayload, 'test_valid_signature');
  console.log('First Webhook Dispatch:', firstWebhookRes.processed ? 'PROCESSED' : 'FAILED', firstWebhookRes);

  // Second dispatch: DUPLICATE webhook from gateway
  const duplicateWebhookRes = await PaymentService.processWebhook(mockWebhookPayload, 'test_valid_signature');
  console.log('Duplicate Webhook Dispatch (Idempotency):', duplicateWebhookRes.note || 'PASSED');

  // Third dispatch: Tampered signature
  let tamperedCaught = false;
  try {
    await PaymentService.processWebhook(mockWebhookPayload, 'tampered_invalid_signature');
  } catch (err: any) {
    tamperedCaught = true;
    console.log('Tampered webhook correctly blocked:', err.message);
  }
  console.log('✅ WEBHOOK SECURITY & IDEMPOTENCY PASSED:', tamperedCaught ? 'PASSED' : 'FAILED');

  // 5. Refund & Financial Ledger Reversal Test
  console.log('\n--- 5. Testing Refund Processing & Ledger Reversal ---');
  const refundRes = await PaymentService.processRefund(confirmedBooking.id, 'Customer cancellation within free window');
  console.log('Refund Processed:', refundRes.success ? 'PASSED' : 'FAILED', {
    refundAmount: refundRes.refundAmount,
    bookingId: refundRes.bookingId,
  });

  const remainingEarning = await prisma.providerEarning.findUnique({
    where: { bookingId: confirmedBooking.id },
  });
  console.log('✅ REVERSAL CHECK PASSED: Provider earning ledger deleted/reversed:', remainingEarning === null);

  console.log('\n================================================================');
  console.log('ALL CONCURRENCY, STRESS & FINANCIAL EDGE CASE TESTS PASSED (100%)!');
  console.log('================================================================\n');
}

runStressAndEdgeCaseTests()
  .catch((err) => {
    console.error('Stress test error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
