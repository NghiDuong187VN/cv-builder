import Script from 'next/script';
import { LIVE_CHAT_CONFIG } from '@/lib/creator';

export default function SupportChatWidget() {
  if (!LIVE_CHAT_CONFIG.enabled) return null;

  if (LIVE_CHAT_CONFIG.provider === 'crisp') {
    return (
      <>
        <Script id="crisp-config" strategy="afterInteractive">
          {`window.$crisp=[];window.CRISP_WEBSITE_ID=${JSON.stringify(LIVE_CHAT_CONFIG.crispWebsiteId)};`}
        </Script>
        <Script
          id="crisp-widget"
          src="https://client.crisp.chat/l.js"
          strategy="afterInteractive"
        />
      </>
    );
  }

  if (LIVE_CHAT_CONFIG.provider === 'tawk') {
    return (
      <Script
        id="tawk-widget"
        src={LIVE_CHAT_CONFIG.tawkSrc}
        strategy="afterInteractive"
      />
    );
  }

  return null;
}
