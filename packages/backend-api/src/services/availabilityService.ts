import { prisma } from '../prisma';
import { TimeSlot } from '@quick-appointments/shared-types';

export class AvailabilityService {
  // Key-based asynchronous mutex lock map for concurrency coordination
  private static slotLocks = new Map<string, Promise<void>>();

  private static async acquireSlotLock(key: string): Promise<() => void> {
    while (this.slotLocks.has(key)) {
      await this.slotLocks.get(key);
    }
    let release: () => void;
    const lockPromise = new Promise<void>((resolve) => {
      release = resolve;
    });
    this.slotLocks.set(key, lockPromise);

    return () => {
      this.slotLocks.delete(key);
      release!();
    };
  }

  /**
   * Generate provider time slots for a specific date
   * Considers working hours, lunch breaks, existing confirmed bookings, and active reservations
   */
  static async getAvailableSlots(providerId: string, dateStr: string, durationMinutes: number = 60): Promise<TimeSlot[]> {
    const targetDate = new Date(dateStr);
    const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 1 = Monday ... 6 = Saturday

    // 1. Fetch provider working hours for this day
    const workingHour = await prisma.providerWorkingHour.findFirst({
      where: {
        providerId,
        dayOfWeek,
      },
    });

    // If no schedule configured or marked as closed, return empty
    if (!workingHour || workingHour.isClosed) {
      return [];
    }

    const [openH, openM] = workingHour.openTime.split(':').map(Number);
    const [closeH, closeM] = workingHour.closeTime.split(':').map(Number);

    const startMinutes = openH * 60 + openM;
    const endMinutes = closeH * 60 + closeM;

    let breakStartMin = -1;
    let breakEndMin = -1;
    if (workingHour.breakStart && workingHour.breakEnd) {
      const [bStartH, bStartM] = workingHour.breakStart.split(':').map(Number);
      const [bEndH, bEndM] = workingHour.breakEnd.split(':').map(Number);
      breakStartMin = bStartH * 60 + bStartM;
      breakEndMin = bEndH * 60 + bEndM;
    }

    // 2. Fetch existing confirmed bookings for this date
    const bookings = await prisma.booking.findMany({
      where: {
        providerId,
        date: dateStr,
        status: { in: ['CONFIRMED', 'IN_PROGRESS', 'PENDING'] },
      },
    });

    const bookedTimes = new Set(bookings.map(b => b.startTime));

    // 3. Fetch active slot reservations (temporary 10-min locks)
    const activeReservations = await prisma.slotReservation.findMany({
      where: {
        providerId,
        date: dateStr,
        isReleased: false,
        expiresAt: { gt: new Date() },
      },
    });

    const reservedTimes = new Set(activeReservations.map(r => r.startTime));

    // 4. Generate discrete slots
    const slots: TimeSlot[] = [];
    const step = 60; // 1 hour standard interval

    for (let current = startMinutes; current + durationMinutes <= endMinutes; current += step) {
      const slotHour = Math.floor(current / 60);
      const slotMinute = current % 60;
      const timeString = `${String(slotHour).padStart(2, '0')}:${String(slotMinute).padStart(2, '0')}`;

      // Check if slot falls during break
      const isDuringBreak = breakStartMin !== -1 && current >= breakStartMin && current < breakEndMin;
      const isBooked = bookedTimes.has(timeString);
      const isReserved = reservedTimes.has(timeString);

      if (isDuringBreak) {
        slots.push({
          time: timeString,
          isAvailable: false,
          reason: 'Provider Break',
        });
      } else if (isBooked) {
        slots.push({
          time: timeString,
          isAvailable: false,
          reason: 'Booked',
        });
      } else if (isReserved) {
        slots.push({
          time: timeString,
          isAvailable: false,
          reason: 'Reserved (Checkout in progress)',
        });
      } else {
        slots.push({
          time: timeString,
          isAvailable: true,
        });
      }
    }

    return slots;
  }

  /**
   * Concurrency Safe: Hold a slot reservation for 10 minutes with Mutex Lock
   */
  static async reserveSlot(customerId: string, providerId: string, serviceId: string, date: string, startTime: string) {
    const lockKey = `${providerId}:${date}:${startTime}`;
    const releaseLock = await this.acquireSlotLock(lockKey);

    try {
      // Calculate end time
      const [h, m] = startTime.split(':').map(Number);
      const endH = h + 1;
      const endTime = `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

      // 1. Verify no existing confirmed booking
      const existingBooking = await prisma.booking.findFirst({
        where: {
          providerId,
          date,
          startTime,
          status: { in: ['CONFIRMED', 'IN_PROGRESS'] },
        },
      });

      if (existingBooking) {
        throw new Error('This time slot is already booked');
      }

      // 2. Verify no active unexpired reservation
      const existingReservation = await prisma.slotReservation.findFirst({
        where: {
          providerId,
          date,
          startTime,
          isReleased: false,
          expiresAt: { gt: new Date() },
        },
      });

      if (existingReservation && existingReservation.customerId !== customerId) {
        throw new Error('This slot is currently held by another user. Try another slot or check back in 10 minutes.');
      }

      // If customer already holds this slot, renew expiry
      if (existingReservation && existingReservation.customerId === customerId) {
        return existingReservation;
      }

      // 3. Hold slot for 10 minutes
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      const reservation = await prisma.slotReservation.create({
        data: {
          customerId,
          providerId,
          serviceId,
          date,
          startTime,
          endTime,
          expiresAt,
          isReleased: false,
        },
      });

      return reservation;
    } finally {
      releaseLock();
    }
  }
}
