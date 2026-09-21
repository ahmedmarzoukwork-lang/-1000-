/**
 * Audio Chime and Browser Notification Utilities for Daily Herbal Reminders
 */

export function playHerbalChime(): void {
  try {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Harmonic Solfeggio tones: 528 Hz (healing frequency) & 792 Hz
    // First tone (528 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(528, now);
    gain1.gain.setValueAtTime(0.0001, now);
    gain1.gain.linearRampToValueAtTime(0.2, now + 0.08);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.95);

    // Second harmonic tone (792 Hz - 3:2 fifth)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(792, now + 0.18);
    gain2.gain.setValueAtTime(0.0001, now + 0.18);
    gain2.gain.linearRampToValueAtTime(0.18, now + 0.26);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 1.25);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.18);
    osc2.stop(now + 1.3);

    // Third high sparkle tone (1056 Hz - octave)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = "sine";
    osc3.frequency.setValueAtTime(1056, now + 0.35);
    gain3.gain.setValueAtTime(0.0001, now + 0.35);
    gain3.gain.linearRampToValueAtTime(0.12, now + 0.42);
    gain3.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(now + 0.35);
    osc3.stop(now + 1.45);
  } catch (err) {
    console.warn("Could not play herbal audio chime:", err);
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) {
    return "denied";
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn("Notification permission request failed:", err);
    return "denied";
  }
}

export function showBrowserNotification(
  title: string,
  body: string,
  tag?: string
): void {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  try {
    new Notification(title, {
      body,
      tag: tag || "herbal-reminder",
      icon: "/favicon.ico",
      requireInteraction: false,
    });
  } catch (err) {
    console.warn("Failed to show browser notification:", err);
  }
}
