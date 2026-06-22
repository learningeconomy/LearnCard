/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Analytics_Tipimproveclaimratedesc5Inputs */

const en_developerportal_dashboards_tabs_analytics_tipimproveclaimratedesc5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Tipimproveclaimratedesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Send reminder emails to recipients with unclaimed credentials.`)
};

const es_developerportal_dashboards_tabs_analytics_tipimproveclaimratedesc5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Tipimproveclaimratedesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envía correos de recordatorio a los destinatarios con credenciales sin reclamar.`)
};

const fr_developerportal_dashboards_tabs_analytics_tipimproveclaimratedesc5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Tipimproveclaimratedesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envoyez des emails de rappel aux destinataires avec des credentials non réclamés.`)
};

const ar_developerportal_dashboards_tabs_analytics_tipimproveclaimratedesc5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Analytics_Tipimproveclaimratedesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أرسل رسائل تذكير عبر البريد الإلكتروني إلى المستلمين الذين لديهم بيانات اعتماد غير مطالب بها.`)
};

/**
* | output |
* | --- |
* | "Send reminder emails to recipients with unclaimed credentials." |
*
* @param {Developerportal_Dashboards_Tabs_Analytics_Tipimproveclaimratedesc5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_analytics_tipimproveclaimratedesc5 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Analytics_Tipimproveclaimratedesc5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Analytics_Tipimproveclaimratedesc5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_analytics_tipimproveclaimratedesc5(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_analytics_tipimproveclaimratedesc5(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_analytics_tipimproveclaimratedesc5(inputs)
	return ar_developerportal_dashboards_tabs_analytics_tipimproveclaimratedesc5(inputs)
});
export { developerportal_dashboards_tabs_analytics_tipimproveclaimratedesc5 as "developerPortal.dashboards.tabs.analytics.tipImproveClaimRateDesc" }