/**
 * Voice Distress Capture & On-Device Transcription
 * Captures one natural distress utterance using Voice Activity Detection (VAD)
 * and transcribes on-device in real time with fallback.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface VoiceCaptureResult {
  transcript: string;
  language: string;
  duration_sec: number;
}

export class VoiceDistressCapture {
  private static recognition: any = null;
  private static mediaStream: MediaStream | null = null;
  private static isRecording = false;

  /**
   * Check if speech recognition is available in current browser / environment
   */
  public static isSpeechSupported(): boolean {
    if (typeof window === "undefined") return false;
    return Boolean(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    );
  }

  /**
   * Start listening for voice distress utterance with auto-pause detection
   */
  public static startCapture(
    preferredLang: string,
    onTranscriptUpdate: (text: string) => void,
    onComplete: (result: VoiceCaptureResult) => void
  ): () => void {
    if (typeof window === "undefined") {
      return () => {};
    }

    const SpeechClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    let finalTranscript = "";
    const startTime = Date.now();
    let silenceTimer: NodeJS.Timeout | null = null;

    if (!SpeechClass) {
      console.warn("[SOS] Web Speech Recognition not available, falling back to manual input.");
      return () => {};
    }

    try {
      this.recognition = new SpeechClass();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;

      // Set language code based on selected lang
      const langMap: Record<string, string> = {
        hi: "hi-IN",
        en: "en-IN",
        ta: "ta-IN",
        te: "te-IN",
        ml: "ml-IN",
        gu: "gu-IN",
        mr: "mr-IN",
        bn: "bn-IN",
        kn: "kn-IN",
        or: "or-IN",
      };
      this.recognition.lang = langMap[preferredLang] || "en-IN";

      this.recognition.onstart = () => {
        this.isRecording = true;
        console.log(`[SOS] state=CAPTURING lang=${this.recognition.lang}`);
      };

      this.recognition.onresult = (event: any) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + " ";
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        const currentText = (finalTranscript + interim).trim();
        onTranscriptUpdate(currentText);

        // VAD Pause Detection: Reset silence timer on new speech
        if (silenceTimer) clearTimeout(silenceTimer);
        silenceTimer = setTimeout(() => {
          if (currentText.length > 3 && this.isRecording) {
            console.log(`[SOS] VAD detected pause/end of utterance. Stopping capture.`);
            this.stopCapture();
            const duration = (Date.now() - startTime) / 1000;
            onComplete({
              transcript: currentText,
              language: preferredLang,
              duration_sec: duration,
            });
          }
        }, 2200); // 2.2s natural pause threshold
      };

      this.recognition.onerror = (err: any) => {
        console.warn("[SOS] Speech recognition error:", err);
      };

      this.recognition.onend = () => {
        this.isRecording = false;
        console.log(`[SOS] state=TRANSCRIBING final_text="${finalTranscript.trim()}"`);
        const duration = (Date.now() - startTime) / 1000;
        onComplete({
          transcript: finalTranscript.trim() || "Emergency assistance requested.",
          language: preferredLang,
          duration_sec: duration,
        });
      };

      this.recognition.start();

      // Maximum 12 seconds capture safety ceiling
      const safetyTimeout = setTimeout(() => {
        if (this.isRecording) {
          this.stopCapture();
        }
      }, 12000);

      return () => {
        clearTimeout(safetyTimeout);
        if (silenceTimer) clearTimeout(silenceTimer);
        this.stopCapture();
      };
    } catch (e) {
      console.error("[SOS] Failed to start speech recognition:", e);
      return () => {};
    }
  }

  public static stopCapture(): void {
    if (this.recognition && this.isRecording) {
      try {
        this.recognition.stop();
      } catch (e) {
        console.warn("[SOS] Recognition stop note:", e);
      }
      this.isRecording = false;
    }
  }
}
