/**
 * Hardware Key & Volume Trigger Listener
 * Listens for triple-press of Volume-Down (or Volume-Up) within <= 2.5 seconds.
 * Supports Android WebViews, PWA KeyEvents, Media Keys, F1/F2 keys, and Alt+V testing shortcuts.
 * Includes false trigger guard (resets if slow or < 3 presses) and haptic/audio confirmation.
 */

const ROLLING_WINDOW_MS = 2500; // 2.5 seconds
const TARGET_PRESS_COUNT = 3;

export class VolumeKeyListener {
  private static pressTimestamps: number[] = [];
  private static onTriggerCallback: (() => void) | null = null;
  private static listenerAttached = false;

  public static init(onTrigger: () => void): () => void {
    this.onTriggerCallback = onTrigger;

    if (typeof window === "undefined" || this.listenerAttached) {
      return () => this.destroy();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for VolumeDown/VolumeUp key, keycode 174/175, or physical keys mapped by Android
      const isVolKey = 
        event.key === "AudioVolumeDown" || 
        event.key === "VolumeDown" || 
        event.key === "AudioVolumeUp" ||
        event.key === "VolumeUp" ||
        event.code === "AudioVolumeDown" ||
        event.code === "VolumeDown" ||
        event.code === "AudioVolumeUp" ||
        event.code === "VolumeUp" ||
        event.keyCode === 174 ||
        event.keyCode === 175 ||
        event.keyCode === 25 || // Android KEYCODE_VOLUME_DOWN
        event.keyCode === 24 || // Android KEYCODE_VOLUME_UP
        event.key === "F1" ||   // Web simulation hotkey
        event.key === "F2" ||
        (event.key.toLowerCase() === "v" && event.altKey) ||
        (event.key.toLowerCase() === "s" && event.altKey);

      if (!isVolKey) return;

      const now = Date.now();
      // Remove timestamps older than rolling window
      this.pressTimestamps = this.pressTimestamps.filter((t) => now - t <= ROLLING_WINDOW_MS);
      this.pressTimestamps.push(now);

      console.log(`[SOS] trigger=hardware_key_press count=${this.pressTimestamps.length}/${TARGET_PRESS_COUNT} window=${ROLLING_WINDOW_MS}ms`);

      if (this.pressTimestamps.length >= TARGET_PRESS_COUNT) {
        console.log(`[SOS] trigger=hardware_triple_press status=ARMED`);
        this.pressTimestamps = []; // Reset window
        this.playConfirmationHaptics();
        if (this.onTriggerCallback) {
          this.onTriggerCallback();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown, { passive: true });
    this.listenerAttached = true;

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      this.listenerAttached = false;
    };
  }

  public static recordManualPress(): void {
    const now = Date.now();
    this.pressTimestamps = this.pressTimestamps.filter((t) => now - t <= ROLLING_WINDOW_MS);
    this.pressTimestamps.push(now);

    console.log(`[SOS] manual_press count=${this.pressTimestamps.length}/${TARGET_PRESS_COUNT}`);

    if (this.pressTimestamps.length >= TARGET_PRESS_COUNT) {
      this.pressTimestamps = [];
      this.playConfirmationHaptics();
      if (this.onTriggerCallback) {
        this.onTriggerCallback();
      }
    }
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
