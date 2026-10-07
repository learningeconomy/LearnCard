/**
 * Re-exported from i18n/index.ts. The original I18nProvider used react-i18next's
 * useTranslation() to react to language changes. With Paraglide, the LocaleProvider
 * in i18n/index.ts handles <html dir/lang> updates via React effect.
 *
 * This file exists for backwards-compatible import paths during the migration.
 */
export { LocaleProvider as I18nProvider } from './index';
