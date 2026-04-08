export const WHATSAPP_NUMBER = '27712058512';
export const WHATSAPP_TEL = '+27712058512';
export const WHATSAPP_DISPLAY_NUMBER = '+27 71 205 8512';

export const DEFAULT_WHATSAPP_MESSAGE =
  "Hi! I'm interested in your furniture and curtains. Can you help me?";

export function buildWhatsAppUrl(message?: string): string {
  if (!message) {
    return `https://wa.me/${WHATSAPP_NUMBER}`;
  }

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
