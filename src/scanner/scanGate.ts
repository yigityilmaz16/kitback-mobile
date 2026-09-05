// Suppress rapid repeats, but always permit retrying the same label later.
export class ScanGate {
  private lastCode: string | null = null;
  private acceptedAt = -Infinity;
  accept(code: string, time = Date.now()): boolean {
    if (code === this.lastCode && time - this.acceptedAt < 1600) return false;
    this.lastCode = code;
    this.acceptedAt = time;
    return true;
  }
}
