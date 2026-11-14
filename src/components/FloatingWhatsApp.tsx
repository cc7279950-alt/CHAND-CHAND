import { MessageCircle } from 'lucide-react';
import { buildWhatsAppUrl, DEFAULT_WHATSAPP_DISPLAY } from '../lib/format.ts';

interface FloatingWhatsAppProps {
  motorcycleName?: string;
}

export function FloatingWhatsApp({ motorcycleName }: FloatingWhatsAppProps) {
  const url = buildWhatsAppUrl(motorcycleName);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Chat with CHAND MOTORS on WhatsApp (${DEFAULT_WHATSAPP_DISPLAY})`}
      title={`WhatsApp CHAND MOTORS: ${DEFAULT_WHATSAPP_DISPLAY}`}
      className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2.5 h-12 px-4 rounded-full bg-[#16A34A] hover:bg-[#15803D] text-white shadow-xl border border-emerald-400/30 transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98]"
    >
      <MessageCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
      <span className="hidden sm:inline text-sm font-semibold whitespace-nowrap tabular-nums">
        WhatsApp {DEFAULT_WHATSAPP_DISPLAY}
      </span>
    </a>
  );
}
