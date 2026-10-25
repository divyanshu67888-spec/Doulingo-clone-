/**
 * Browser speechSynthesis wrapper for Spanish language audio.
 * Uses es-ES or es-MX, and does not block the lesson flow if speech synthesis is unavailable.
 */

export function speakSpanish(text: string): { success: boolean; fallbackMessage?: string } {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return { success: false, fallbackMessage: 'Speech synthesis is not supported on this browser.' };
  }

  try {
    window.speechSynthesis.cancel(); // Stop any pending speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 0.9; // Slightly slower for clarity

    const voices = window.speechSynthesis.getVoices();
    const spanishVoice = voices.find(
      (v) => v.lang.startsWith('es-') || v.lang.includes('es_') || v.name.toLowerCase().includes('spanish')
    );

    if (spanishVoice) {
      utterance.voice = spanishVoice;
    }

    window.speechSynthesis.speak(utterance);
    return { success: true };
  } catch (e) {
    console.warn('Speech synthesis error:', e);
    return { success: false, fallbackMessage: 'Unable to play pronunciation audio.' };
  }
}
