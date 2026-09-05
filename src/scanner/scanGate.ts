// A camera can report the same stationary label continuously. Ignore it until a
// different label enters the frame so an old callback cannot overwrite feedback.
export class ScanGate {
  private lastCode: string | null = null;
  accept(code: string, _time = Date.now()): boolean {
    if (code === this.lastCode) return false;
    this.lastCode = code;
    return true;
  }
}
