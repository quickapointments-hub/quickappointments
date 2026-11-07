import { prisma } from '../prisma';

export class SlotCleanupWorker {
  private static timer: NodeJS.Timeout | null = null;

  /**
   * Run cleanup once: mark expired, unconfirmed reservations as released
   */
  static async runCleanup() {
    const now = new Date();
    const result = await prisma.slotReservation.updateMany({
      where: {
        isReleased: false,
        expiresAt: { lt: now },
      },
      data: {
        isReleased: true,
      },
    });

    if (result.count > 0) {
      console.log(`[SlotCleanupWorker] Released ${result.count} expired slot reservations back into open inventory at ${now.toISOString()}`);
    }

    return result.count;
  }

  /**
   * Start recurring worker interval (e.g. every 60 seconds)
   */
  static start(intervalMs: number = 60000) {
    if (this.timer) return;
    console.log(`[SlotCleanupWorker] Started periodic slot release worker (interval: ${intervalMs / 1000}s)`);
    this.timer = setInterval(() => {
      this.runCleanup().catch((err) => console.error('[SlotCleanupWorker] Error during slot cleanup:', err));
    }, intervalMs);
  }

  static stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log('[SlotCleanupWorker] Stopped periodic worker.');
    }
  }
}
