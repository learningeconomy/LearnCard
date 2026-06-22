/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Consentflowcode_Consenturl_Copyurl5Inputs */

const en_developerportal_dashboards_tabs_consentflowcode_consenturl_copyurl5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Consenturl_Copyurl5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copy URL`)
};

const es_developerportal_dashboards_tabs_consentflowcode_consenturl_copyurl5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Consenturl_Copyurl5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copiar URL`)
};

const fr_developerportal_dashboards_tabs_consentflowcode_consenturl_copyurl5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Consenturl_Copyurl5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copier l'URL`)
};

const ar_developerportal_dashboards_tabs_consentflowcode_consenturl_copyurl5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Consenturl_Copyurl5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نسخ الرابط`)
};

/**
* | output |
* | --- |
* | "Copy URL" |
*
* @param {Developerportal_Dashboards_Tabs_Consentflowcode_Consenturl_Copyurl5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_consentflowcode_consenturl_copyurl5 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Consentflowcode_Consenturl_Copyurl5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Consentflowcode_Consenturl_Copyurl5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_consentflowcode_consenturl_copyurl5(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_consentflowcode_consenturl_copyurl5(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_consentflowcode_consenturl_copyurl5(inputs)
	return ar_developerportal_dashboards_tabs_consentflowcode_consenturl_copyurl5(inputs)
});
export { developerportal_dashboards_tabs_consentflowcode_consenturl_copyurl5 as "developerPortal.dashboards.tabs.consentFlowCode.consentUrl.copyUrl" }