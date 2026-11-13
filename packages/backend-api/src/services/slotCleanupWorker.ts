import { SupabaseDb } from '../db/supabaseDb';

export class SlotCleanupWorker {
  private static timer: NodeJS.Timeout | null = null;

  static async runCleanup() {
    const nowIso = new Date().toISOString();
    const updated = await SupabaseDb.update<any>(
      'slot_reservations',
      `is_released=eq.false&expires_at=lt.${encodeURIComponent(nowIso)}`,
      { is_released: true }
    );
    if (updated.length > 0) {
      console.log(`[SlotCleanupWorker] Released ${updated.length} expired slot reservations at ${nowIso}`);
    }
    return updated.length;
  }

  static start(intervalMs: number = 60000) {
    if (this.timer) return;
    console.log(`[SlotCleanupWorker] Started periodic slot release worker (interval: ${intervalMs / 1000}s)`);
    this.timer = setInterval(() => {
      this.runCleanup().catch((err) => console.error('[SlotCleanupWorker] Cleanup warning:', err.message));
    }, intervalMs);
    if (this.timer.unref) this.timer.unref();
  }

  static stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
