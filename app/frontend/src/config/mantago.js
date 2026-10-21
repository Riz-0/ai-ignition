/* ============================================================
   MantaGO live chat configuration — "2AM Assistant"
   ------------------------------------------------------------
   MantaGO (by Eslitec) is the merchant-side conversation channel.
   Our app is the shopper-side companion: budgets and savings stay
   in our app and are NEVER sent to MantaGO. Only preferences the
   user types into the chat reach the bot — the privacy wall.

   The live widget loads an iframe from livechat.mantago.cc with the
   bot id below. To use a different bot (or a per-language bot), edit
   BOT_ID / BOT_ID_BY_LANG here — nothing else needs to change.
   ============================================================ */

// Default MantaGO bot id (from the account's embed snippet).
export const MANTAGO_BOT_ID = 'Jrb2vrKbW';

// Origin that hosts the widget. postMessage traffic is validated against this.
export const MANTAGO_ORIGIN = 'https://livechat.mantago.cc';

// Base URL for the chat iframe.
export const MANTAGO_IFRAME_BASE = 'https://livechat.mantago.cc';

/**
 * Optional per-language bot ids. If your MantaGO account has a separate
 * bot per language, map them here. Any language not listed falls back to
 * MANTAGO_BOT_ID and we pass the language as a URL parameter instead.
 */
export const BOT_ID_BY_LANG = {
  // en: 'Jrb2vrKbW',
  // ja: '...',
  // zh: '...',
  // th: '...',
  // ko: '...',
};

/**
 * MantaGO's GAI supports English, Chinese, Japanese, Thai and Korean —
 * the same set the app ships. Map our app language codes to MantaGO's.
 */
const LANG_PARAM = {
  en: 'en',
  ja: 'ja',
  zh: 'zh',
  th: 'th',
  ko: 'ko',
};

/**
 * Build the iframe URL for a given app language.
 * We always include botId; we append &lang as a hint so the bot can
 * adapt to the UI language. If MantaGO ignores the param it simply
 * uses the dashboard default — harmless either way.
 */
export function buildMantagoUrl(lang = 'en') {
  const botId = BOT_ID_BY_LANG[lang] || MANTAGO_BOT_ID;
  const langParam = LANG_PARAM[lang] || 'en';
  const url = new URL(MANTAGO_IFRAME_BASE);
  url.searchParams.set('botId', botId);
  url.searchParams.set('lang', langParam);
  return url.toString();
}

/** Whether a real bot id is configured (vs a placeholder). */
export function isMantagoConfigured() {
  return !!MANTAGO_BOT_ID && MANTAGO_BOT_ID !== 'REPLACE_ME';
}
