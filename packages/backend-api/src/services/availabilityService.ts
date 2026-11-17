import { v4 as uuidv4 } from 'uuid';
import { TimeSlot } from '@quick-appointments/shared-types';
import { SupabaseDb, normalizeTimeTo24h } from '../db/supabaseDb';

const slotLockMutex = new Map<string, Promise<any>>();

const ACTIVE_BOOKING_STATUSES = ['PENDING', 'HELD', 'AWAITING', 'CONFIRMED', 'IN_PROGRESS'];

export class AvailabilityService {
  private static timeToMinutes(timeStr: string): number {
    const normalized = normalizeTimeTo24h(timeStr, '09:00');
    const [h, m] = normalized.split(':').map(Number);
    return h * 60 + m;
  }

  private static minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  static async getAvailableSlots(
    providerId: string,
    dateStr: string,
    durationMinutes: number = 60
  ): Promise<TimeSlot[]> {
    const pid = encodeURIComponent(providerId);
    const provider = await SupabaseDb.selectOne<any>('provider_profiles', `select=*&id=eq.${pid}`);
    if (!provider || provider.verification_status !== 'APPROVED' || !provider.is_accepting_bookings) {
      return [];
    }

    const targetDate = new Date(`${dateStr}T00:00:00Z`);
    const dayOfWeek = Number.isNaN(targetDate.getTime()) ? new Date().getDay() : targetDate.getUTCDay();

    const [workingHour, existingBookings, activeReservations] = await Promise.all([
      SupabaseDb.selectOne<any>(
        'provider_working_hours',
        `select=*&provider_id=eq.${pid}&day_of_week=eq.${dayOfWeek}`
      ),
      SupabaseDb.select<any>(
        'bookings',
        `select=start_time,end_time,status&provider_id=eq.${pid}&date=eq.${encodeURIComponent(dateStr)}&status=in.(${ACTIVE_BOOKING_STATUSES.join(',')})`
      ),
      SupabaseDb.select<any>(
        'slot_reservations',
        `select=start_time,end_time,expires_at&provider_id=eq.${pid}&date=eq.${encodeURIComponent(dateStr)}&is_released=eq.false&expires_at=gt.${encodeURIComponent(new Date().toISOString())}`
      ),
    ]);

    if (workingHour && workingHour.is_closed) {
      return [];
    }

    const openMins = this.timeToMinutes(workingHour?.open_time || '09:00');
    const closeMins = this.timeToMinutes(workingHour?.close_time || '20:00');
    const breakStartMins = workingHour?.break_start ? this.timeToMinutes(workingHour.break_start) : null;
    const breakEndMins = workingHour?.break_end ? this.timeToMinutes(workingHour.break_end) : null;

    if (closeMins <= openMins) return [];

    const slots: TimeSlot[] = [];
    const step = 30;

    for (let current = openMins; current + durationMinutes <= closeMins; current += step) {
      const end = current + durationMinutes;
      const startTimeStr = this.minutesToTime(current);
      const endTimeStr = this.minutesToTime(end);

      if (breakStartMins !== null && breakEndMins !== null) {
        if (current < breakEndMins && end > breakStartMins) continue;
      }

      const isBooked = existingBookings.some((b) => {
        const bStart = this.timeToMinutes(b.start_time);
        const bEnd = this.timeToMinutes(b.end_time);
        return current < bEnd && end > bStart;
      });

      const isReserved = activeReservations.some((r) => {
        const rStart = this.timeToMinutes(r.start_time);
        const rEnd = this.timeToMinutes(r.end_time);
        return current < rEnd && end > rStart;
      });

      const isAvailable = !isBooked && !isReserved;
      slots.push({
        time: startTimeStr,
        isAvailable,
      });
    }

    return slots;
  }

  static async reserveSlot(
    customerId: string,
    providerId: string,
    serviceId: string,
    dateStr: string,
    startTime: string
  ) {
    const normalizedStart = normalizeTimeTo24h(startTime, startTime);
    const lockKey = `${providerId}_${dateStr}_${normalizedStart}`;
    const prevPromise = slotLockMutex.get(lockKey) || Promise.resolve();

    const currentTask = prevPromise
      .catch(() => { })
      .then(async () => {
        const provider = await SupabaseDb.selectOne<any>(
          'provider_profiles',
          `select=id,verification_status,is_accepting_bookings&id=eq.${encodeURIComponent(providerId)}`
        );
        if (!provider || provider.verification_status !== 'APPROVED' || !provider.is_accepting_bookings) {
          throw new Error('This service provider is not currently verified or accepting bookings.');
        }

        const service = await SupabaseDb.selectOne<any>(
          'services',
          `select=*&id=eq.${encodeURIComponent(serviceId)}`
        );
        if (!service) throw new Error('Service not found');

        const customRate = await SupabaseDb.selectOne<any>(
          'provider_service_rates',
          `select=*&provider_id=eq.${encodeURIComponent(providerId)}&service_id=eq.${encodeURIComponent(serviceId)}&is_active=eq.true`
        );

        const duration = Number(customRate?.custom_duration_minutes || service.duration_minutes || 60);
        const startMins = this.timeToMinutes(normalizedStart);
        const endMins = startMins + duration;
        const endTime = this.minutesToTime(endMins);

        const [existingBookings, existingReservations] = await Promise.all([
          SupabaseDb.select<any>(
            'bookings',
            `select=start_time,end_time&provider_id=eq.${encodeURIComponent(providerId)}&date=eq.${encodeURIComponent(dateStr)}&status=in.(${ACTIVE_BOOKING_STATUSES.join(',')})`
          ),
          SupabaseDb.select<any>(
            'slot_reservations',
            `select=start_time,end_time&provider_id=eq.${encodeURIComponent(providerId)}&date=eq.${encodeURIComponent(dateStr)}&is_released=eq.false&expires_at=gt.${encodeURIComponent(new Date().toISOString())}`
          ),
        ]);

        const overlapBooking = existingBookings.find((b) => {
          const bStart = this.timeToMinutes(b.start_time);
          const bEnd = this.timeToMinutes(b.end_time);
          return startMins < bEnd && endMins > bStart;
        });
        if (overlapBooking) {
          throw new Error(`Slot ${normalizedStart} is already booked.`);
        }

        const overlapHold = existingReservations.find((r) => {
          const rStart = this.timeToMinutes(r.start_time);
          const rEnd = this.timeToMinutes(r.end_time);
          return startMins < rEnd && endMins > rStart;
        });
        if (overlapHold) {
          throw new Error(`Slot ${normalizedStart} is currently held by another customer.`);
        }

        const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
        const reservationToken = `HOLD-${uuidv4().slice(0, 8).toUpperCase()}`;

        const reservation = await SupabaseDb.insertOne<any>('slot_reservations', {
          provider_id: providerId,
          customer_id: customerId,
          service_id: serviceId,
          date: dateStr,
          start_time: normalizedStart,
          end_time: endTime,
          reservation_token: reservationToken,
          expires_at: expiresAt,
          is_released: false,
        });

        const basePrice = Number(customRate?.custom_price ?? service.base_price ?? 0);
        return {
          id: reservation.id,
          reservationToken: reservation.reservation_token,
          providerId: reservation.provider_id,
          serviceId: reservation.service_id,
          date: reservation.date,
          startTime: reservation.start_time,
          endTime: reservation.end_time,
          expiresAt: reservation.expires_at,
          servicePrice: basePrice,
        };
      });

    slotLockMutex.set(lockKey, currentTask);
    try {
      return await currentTask;
    } finally {
      if (slotLockMutex.get(lockKey) === currentTask) {
        slotLockMutex.delete(lockKey);
      }
    }
  }
}
