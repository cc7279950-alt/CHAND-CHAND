export const DEFAULT_WHATSAPP_DISPLAY = '03217293026';
export const WHATSAPP_LINK_BASE = 'https://wa.me/923217293026';

export function formatPkr(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return 'Price on Inquiry';
  return `PKR ${new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(amount)}`;
}

export function buildWhatsAppUrl(motorcycleName?: string, customNote?: string): string {
  const text = customNote
    ? customNote
    : motorcycleName
      ? `Assalam-o-Alaikum CHAND MOTORS, I am interested in the ${motorcycleName}. Please share current availability, estimated on-road pricing, and booking details.`
      : 'Assalam-o-Alaikum CHAND MOTORS, I would like assistance choosing a motorcycle.';
  return `${WHATSAPP_LINK_BASE}?text=${encodeURIComponent(text)}`;
}
