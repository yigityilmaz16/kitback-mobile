// Suppress a stationary code's repeated camera callbacks without dropping other items.
// Database uniqueness remains the source of truth after this short UI cooldown.
export class ScanGate {
  private recent = new Map<string, number>();
  accept(code: string, time = Date.now()): boolean {
    const last = this.recent.get(code);
    if (last !== undefined && time - last < 1600) return false;
    this.recent.set(code, time);
    for (const [key, seen] of this.recent) if (time - seen > 5000) this.recent.delete(key);
    return true;
  }
}
