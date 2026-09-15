/**
 * Hardware Key & Volume Trigger Listener
 * Listens for triple-press of Volume-Down within <= 2.0 seconds.
 * Includes false trigger guard (resets if slow or < 3 presses) and haptic/audio confirmation.
 */

const ROLLING_WINDOW_MS = 2000; // 2 seconds
const TARGET_PRESS_COUNT = 3;

export class VolumeKeyListener {
  private static pressTimestamps: number[] = [];
  private static isArmed: boolean = false;
  private static onTriggerCallback: (() => void) | null = null;
  private static listenerAttached = false;

  public static init(onTrigger: () => void): () => void {
    this.onTriggerCallback = onTrigger;

    if (typeof window === "undefined" || this.listenerAttached) {
      return () => this.destroy();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for VolumeDown key, keycode 174 (MediaVolumeDown), or physical keys mapped by Android WebViews
      const isVolDown = 
        event.key === "AudioVolumeDown" || 
        event.key === "VolumeDown" || 
        event.code === "AudioVolumeDown" ||
        event.code === "VolumeDown" ||
        event.keyCode === 174 ||
        event.key === "F1" || // Web simulation hotkey for VolumeDown
        event.key === "v" && event.altKey; // Alt+V as testing hotkey

      if (!isVolDown) return;

      const now = Date.now();
      // Remove timestamps older than the rolling window
      this.pressTimestamps = this.pressTimestamps.filter((t) => now - t <= ROLLING_WINDOW_MS);
      this.pressTimestamps.push(now);

      console.log(`[SOS] trigger=volume_press count=${this.pressTimestamps.length} window=${ROLLING_WINDOW_MS}ms`);

      if (this.pressTimestamps.length >= TARGET_PRESS_COUNT) {
        console.log(`[SOS] trigger=volume_triple_press status=ARMED`);
        this.pressTimestamps = []; // Reset window
        this.playConfirmationHaptics();
        if (this.onTriggerCallback) {
          this.onTriggerCallback();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    this.listenerAttached = true;

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      this.listenerAttached = false;
    };
  }

  public static destroy(): void {
    this.pressTimestamps = [];
    this.onTriggerCallback = null;
  }

  /**
   * Play strong tactile vibration and synthesized alert beep
   */
  public static playConfirmationHaptics(): void {
    if (typeof window === "undefined") return;

    // Haptic vibration
    if (navigator.vibrate) {
      try {
        navigator.vibrate([150, 80, 150, 80, 300]);
      } catch (e) {
        console.warn("[SOS] Vibration not allowed:", e);
      }
    }

    // Audio confirmation tone via Web Audio API
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch (e) {
      console.warn("[SOS] Audio beep not supported:", e);
    }
  }
}
