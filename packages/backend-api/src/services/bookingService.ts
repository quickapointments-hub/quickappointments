import crypto from 'crypto';
import { BookingStatus } from '@quick-appointments/shared-types';
import {
  SupabaseDb,
  SupabaseDbError,
  mapBookingDto,
  mapCustomerDto,
  mapProviderDto,
  mapServiceDto,
  normalizeTimeTo24h,
} from '../db/supabaseDb';

export class BookingService {
  private static async hydrateBookings(rows: any[]) {
    if (!rows || rows.length === 0) return [];

    const customerIds = Array.from(new Set(rows.map((b) => b.customer_id).filter(Boolean)));
    const providerIds = Array.from(new Set(rows.map((b) => b.provider_id).filter(Boolean)));
    const serviceIds = Array.from(new Set(rows.map((b) => b.service_id).filter(Boolean)));

    const [customers, providers, services] = await Promise.all([
      customerIds.length > 0
        ? SupabaseDb.select<any>('customer_profiles', `select=*&id=in.(${customerIds.join(',')})`)
        : Promise.resolve([]),
      providerIds.length > 0
        ? SupabaseDb.select<any>('provider_profiles', `select=*&id=in.(${providerIds.join(',')})`)
        : Promise.resolve([]),
      serviceIds.length > 0
        ? SupabaseDb.select<any>('services', `select=*&id=in.(${serviceIds.join(',')})`)
        : Promise.resolve([]),
    ]);

    const userIds = Array.from(
      new Set([...customers.map((c) => c.user_id), ...providers.map((p) => p.user_id)].filter(Boolean))
    );
    const users =
      userIds.length > 0
        ? await SupabaseDb.select<any>('users', `select=id,full_name,phone,email,avatar_url,is_active&id=in.(${userIds.join(',')})`)
        : [];

    const userMap = new Map(users.map((u) => [u.id, u]));
    const custMap = new Map(customers.map((c) => [c.id, mapCustomerDto(c, userMap.get(c.user_id))]));
    const provMap = new Map(providers.map((p) => [p.id, mapProviderDto(p, { user: userMap.get(p.user_id) })]));
    const servMap = new Map(services.map((s) => [s.id, s]));

    return rows.map((b) =>
      mapBookingDto(b, {
        service: servMap.get(b.service_id),
        customer: custMap.get(b.customer_id),
        provider: provMap.get(b.provider_id),
      })
    );
  }

  static async confirmBooking(
    customerId: string,
    reservationToken: string,
    paymentMethod: string = 'RAZORPAY',
    notes?: string,
    paymentTxId?: string,
    orderId?: string,
    couponCode?: string
  ) {
    const tokenTrimmed = String(reservationToken || '').trim();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tokenTrimmed);
    const reservationFilter = isUuid
      ? `select=*&or=(reservation_token.eq.${encodeURIComponent(tokenTrimmed)},id.eq.${encodeURIComponent(tokenTrimmed)})`
      : `select=*&reservation_token=eq.${encodeURIComponent(tokenTrimmed)}`;

    const reservation = await SupabaseDb.selectOne<any>('slot_reservations', reservationFilter);

    if (!reservation) throw new Error('Invalid reservation token');
    if (reservation.customer_id !== customerId) {
      throw new Error('Reservation token does not belong to your account');
    }
    if (reservation.is_released) throw new Error('Slot reservation has already been released or used');
    if (new Date(reservation.expires_at).getTime() < Date.now()) {
      throw new Error('Slot hold expired. Please select a new slot.');
    }

    const [provider, service, customer, customRate, paymentSettingsRow, commissionRows] = await Promise.all([
      SupabaseDb.selectOne<any>('provider_profiles', `select=*&id=eq.${encodeURIComponent(reservation.provider_id)}`),
      SupabaseDb.selectOne<any>('services', `select=*&id=eq.${encodeURIComponent(reservation.service_id)}`),
      SupabaseDb.selectOne<any>('customer_profiles', `select=*&id=eq.${encodeURIComponent(customerId)}`),
      SupabaseDb.selectOne<any>(
        'provider_service_rates',
        `select=*&provider_id=eq.${encodeURIComponent(reservation.provider_id)}&service_id=eq.${encodeURIComponent(reservation.service_id)}&is_active=eq.true`
      ),
      SupabaseDb.selectOne<any>('system_settings', `select=*&key=eq.payment_settings`).catch(() => null),
      SupabaseDb.select<any>('commission_settings', `select=*&is_active=eq.true&order=created_at.desc&limit=1`).catch(() => []),
    ]);

    if (!provider || provider.verification_status !== 'APPROVED' || !provider.is_accepting_bookings) {
      throw new Error('Service Provider is currently unavailable or not approved.');
    }
    if (!service) throw new Error('Service not found');
    if (!customer) throw new Error('Customer profile not found');

    const servicePrice = Number(customRate?.custom_price ?? service.base_price ?? 0);
    let discountAmount = 0;

    if (couponCode && couponCode.trim()) {
      const coupon = await SupabaseDb.selectOne<any>(
        'coupons',
        `select=*&code=eq.${encodeURIComponent(couponCode.trim().toUpperCase())}&is_active=eq.true`
      );
      if (coupon && servicePrice >= Number(coupon.min_order_amount || 0)) {
        if (!coupon.expires_at || new Date(coupon.expires_at).getTime() > Date.now()) {
          if (coupon.discount_type === 'PERCENTAGE') {
            discountAmount = Math.round((servicePrice * Number(coupon.value)) / 100);
            if (coupon.max_discount_amount) {
              discountAmount = Math.min(discountAmount, Number(coupon.max_discount_amount));
            }
          } else {
            discountAmount = Math.min(servicePrice, Number(coupon.value));
          }
          await SupabaseDb.updateOne('coupons', coupon.id, { used_count: Number(coupon.used_count || 0) + 1 }).catch(() => { });
        }
      }
    }

    const rawPayVal = paymentSettingsRow?.value;
    let paymentCfg: Record<string, any> = {};
    if (typeof rawPayVal === 'string') {
      try {
        paymentCfg = JSON.parse(rawPayVal) || {};
      } catch {
        paymentCfg = {};
      }
    } else if (rawPayVal && typeof rawPayVal === 'object') {
      paymentCfg = rawPayVal;
    }
    const taxRatePercent = Number(paymentCfg.taxPercent ?? 18);
    const commissionPercent = Number(commissionRows?.[0]?.rate ?? paymentCfg.platformCommissionPercent ?? 15);

    const taxableAmount = Math.max(0, servicePrice - discountAmount);
    const taxAmount = Math.round((taxableAmount * taxRatePercent) / 100);
    const totalAmount = taxableAmount + taxAmount;
    const platformCommission = Math.round((taxableAmount * commissionPercent) / 100);
    const providerEarnings = Math.max(0, taxableAmount - platformCommission);

    const bookingRef = `QA-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const serviceOtp = String(crypto.randomInt(100000, 1000000));
    const isOnlinePaid = paymentMethod !== 'CASH_ON_SERVICE' && Boolean(paymentTxId);
    const initialStatus = isOnlinePaid ? 'CONFIRMED' : 'PENDING';
    const paymentStatus = isOnlinePaid ? 'PAID' : 'PENDING';

    const baseRow: Record<string, any> = {
      booking_ref: bookingRef,
      customer_id: customerId,
      provider_id: provider.id,
      service_id: service.id,
      status: initialStatus,
      date: reservation.date,
      start_time: normalizeTimeTo24h(reservation.start_time, reservation.start_time),
      end_time: normalizeTimeTo24h(reservation.end_time, reservation.end_time),
      notes: notes || null,
      service_price: servicePrice,
      discount_amount: discountAmount,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      platform_commission: platformCommission,
      provider_earnings: providerEarnings,
      payment_status: paymentStatus,
      payment_method: paymentMethod,
      payment_ref: paymentTxId || orderId || null,
      service_otp: serviceOtp,
    };

    let bookingRow: any;
    try {
      bookingRow = await SupabaseDb.insertOne<any>('bookings', baseRow);
    } catch (err: any) {
      // Fallback if Migration 08 hasn't added service_otp column yet on remote Postgres
      if (err instanceof SupabaseDbError && (err.code === 'PGRST204' || String(err.message).includes('service_otp'))) {
        const { service_otp: _omit, ...compatRow } = baseRow;
        compatRow.notes = `${notes ? notes + ' ' : ''}[QA_OTP:${serviceOtp}]`.trim();
        bookingRow = await SupabaseDb.insertOne<any>('bookings', compatRow);
      } else {
        throw err;
      }
    }

    await SupabaseDb.updateOne('slot_reservations', reservation.id, { is_released: true });

    await SupabaseDb.insertOne('booking_status_history', {
      booking_id: bookingRow.id,
      from_status: 'HELD',
      to_status: initialStatus,
      reason: 'Customer confirmed appointment reservation',
    }).catch(() => { });

    await SupabaseDb.insertOne('provider_earnings', {
      provider_id: provider.id,
      booking_id: bookingRow.id,
      gross_amount: taxableAmount,
      platform_fee: platformCommission,
      net_earnings: providerEarnings,
      is_settled: false,
    }).catch(() => { });

    await SupabaseDb.insert('notifications', [
      {
        user_id: customer.user_id,
        type: 'BOOKING_CREATED',
        title: 'Appointment Confirmed',
        message: `Your booking (${bookingRef}) for ${service.name} on ${reservation.date} at ${reservation.start_time} is scheduled. Service OTP: ${serviceOtp}.`,
        data: { bookingId: bookingRow.id, bookingRef, serviceOtp },
      },
      {
        user_id: provider.user_id,
        type: 'BOOKING_AWAITING',
        title: 'New Booking Request',
        message: `New appointment ${bookingRef} for ${service.name} on ${reservation.date} at ${reservation.start_time}.`,
        data: { bookingId: bookingRow.id, bookingRef },
      },
    ]).catch(() => { });

    SupabaseDb.broadcastSync('bookings_updated', {
      bookingId: bookingRow.id,
      providerId: provider.id,
      customerId,
    });

    const hydrated = await this.hydrateBookings([bookingRow]);
    return {
      ...hydrated[0],
      serviceOtp,
    };
  }

  static async getCustomerBookings(customerId: string) {
    const rows = await SupabaseDb.select<any>(
      'bookings',
      `select=*&customer_id=eq.${encodeURIComponent(customerId)}&order=created_at.desc`
    );
    return this.hydrateBookings(rows);
  }

  static async getProviderBookings(providerId: string, statusFilter?: string) {
    const filters = [`select=*`, `provider_id=eq.${encodeURIComponent(providerId)}`];
    if (statusFilter && statusFilter !== 'ALL') {
      filters.push(`status=eq.${encodeURIComponent(statusFilter)}`);
    }
    filters.push('order=created_at.desc');
    const rows = await SupabaseDb.select<any>('bookings', filters.join('&'));
    return this.hydrateBookings(rows);
  }

  static async getBookingById(bookingId: string) {
    const row = await SupabaseDb.selectOne<any>('bookings', `select=*&id=eq.${encodeURIComponent(bookingId)}`);
    if (!row) return null;
    const hydrated = await this.hydrateBookings([row]);
    return hydrated[0];
  }

  static async updateBookingStatus(
    bookingId: string,
    newStatus: BookingStatus | string,
    reason?: string,
    changedBy?: string
  ) {
    const existing = await SupabaseDb.selectOne<any>('bookings', `select=*&id=eq.${encodeURIComponent(bookingId)}`);
    if (!existing) throw new Error('Booking not found');

    const patch: Record<string, any> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };
    if (reason) patch.cancellation_reason = reason;

    let updated: any;
    try {
      updated = await SupabaseDb.updateOne<any>('bookings', bookingId, patch);
    } catch (err: any) {
      const isConstraintErr = String(err.message || '').includes('bookings_status_check');
      if (isConstraintErr) {
        if (newStatus === 'NO_SHOW') {
          updated = await SupabaseDb.updateOne<any>('bookings', bookingId, {
            ...patch,
            status: 'CANCELLED',
            cancellation_reason: reason || 'Customer No Show',
          });
        } else if (newStatus === 'CHECKED_IN') {
          updated = await SupabaseDb.updateOne<any>('bookings', bookingId, {
            ...patch,
            status: 'IN_PROGRESS',
            cancellation_reason: reason || 'Customer Checked In',
          });
        } else if (newStatus === 'DECLINED') {
          updated = await SupabaseDb.updateOne<any>('bookings', bookingId, {
            ...patch,
            status: 'CANCELLED',
            cancellation_reason: reason || 'Declined by provider',
          });
        } else {
          throw err;
        }
      } else {
        throw err;
      }
    }

    // Process refund record if booking was cancelled and paid
    if (newStatus === 'CANCELLED' || updated?.status === 'CANCELLED') {
      if (existing.payment_status === 'PAID') {
        await SupabaseDb.updateOne<any>('bookings', bookingId, { payment_status: 'REFUNDED' }).catch(() => { });
        await SupabaseDb.insertOne('refunds', {
          booking_id: bookingId,
          amount: Number(existing.total_amount || 0),
          reason: reason || (newStatus === 'NO_SHOW' ? 'Customer No Show refund' : 'Booking cancellation refund'),
          status: 'PROCESSING',
          sla_deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        }).catch(() => { });
      }
    }

    await SupabaseDb.insertOne('booking_status_history', {
      booking_id: bookingId,
      from_status: existing.status,
      to_status: updated?.status || newStatus,
      reason: reason || null,
      changed_by: changedBy || null,
    }).catch(() => { });

    SupabaseDb.broadcastSync('bookings_updated', {
      bookingId,
      providerId: existing.provider_id,
      customerId: existing.customer_id,
      status: updated?.status || newStatus,
    });

    const hydrated = await this.hydrateBookings([updated]);
    return hydrated[0];
  }

  static async cancelBooking(bookingId: string, actorUserId: string, isAdmin: boolean, reason?: string) {
    const existing = await SupabaseDb.selectOne<any>('bookings', `select=*&id=eq.${encodeURIComponent(bookingId)}`);
    if (!existing) throw new Error('Booking not found');

    const [customer, provider, service] = await Promise.all([
      SupabaseDb.selectOne<any>('customer_profiles', `select=*&id=eq.${encodeURIComponent(existing.customer_id)}`),
      SupabaseDb.selectOne<any>('provider_profiles', `select=*&id=eq.${encodeURIComponent(existing.provider_id)}`),
      SupabaseDb.selectOne<any>('services', `select=id,name&id=eq.${encodeURIComponent(existing.service_id)}`),
    ]);

    if (!isAdmin && customer?.user_id !== actorUserId && provider?.user_id !== actorUserId) {
      throw new Error('Unauthorized to cancel this booking');
    }
    if (existing.status === 'COMPLETED') {
      throw new Error('Completed appointments cannot be cancelled. Please raise a support ticket.');
    }

    const updated = await SupabaseDb.updateOne<any>('bookings', bookingId, {
      status: 'CANCELLED',
      payment_status: existing.payment_status === 'PAID' ? 'REFUNDED' : existing.payment_status,
      cancellation_reason: reason || 'Cancelled by user',
      updated_at: new Date().toISOString(),
    });

    if (existing.payment_status === 'PAID') {
      await SupabaseDb.insertOne('refunds', {
        booking_id: bookingId,
        amount: Number(existing.total_amount || 0),
        reason: reason || 'Booking cancellation refund',
        status: 'PROCESSING',
        sla_deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      }).catch(() => {});
    }

    await SupabaseDb.insertOne('booking_status_history', {
      booking_id: bookingId,
      from_status: existing.status,
      to_status: 'CANCELLED',
      reason: reason || 'Cancelled',
      changed_by: actorUserId,
    }).catch(() => {});

    if (provider?.user_id) {
      await SupabaseDb.insertOne('notifications', {
        user_id: provider.user_id,
        type: 'BOOKING_CANCELLED',
        title: 'Appointment Cancelled',
        message: `Booking ${existing.booking_ref} (${service?.name || 'Service'}) on ${existing.date} at ${existing.start_time} was cancelled.`,
        data: { bookingId },
      }).catch(() => {});
    }

    SupabaseDb.broadcastSync('bookings_updated', { bookingId, providerId: existing.provider_id });
    const hydrated = await this.hydrateBookings([updated]);
    return hydrated[0];
  }
}
