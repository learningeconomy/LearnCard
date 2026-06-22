/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Consentflowcode_Sendcredentials_Desc4Inputs */

const en_developerportal_dashboards_tabs_consentflowcode_sendcredentials_desc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Sendcredentials_Desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issue credentials to users who have consented`)
};

const es_developerportal_dashboards_tabs_consentflowcode_sendcredentials_desc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Sendcredentials_Desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Emite credenciales a usuarios que han dado su consentimiento`)
};

const fr_developerportal_dashboards_tabs_consentflowcode_sendcredentials_desc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Sendcredentials_Desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Émettez des justificatifs aux utilisateurs qui ont consenti`)
};

const ar_developerportal_dashboards_tabs_consentflowcode_sendcredentials_desc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Sendcredentials_Desc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إصدار المؤهلات للمستخدمين الذين وافقوا`)
};

/**
* | output |
* | --- |
* | "Issue credentials to users who have consented" |
*
* @param {Developerportal_Dashboards_Tabs_Consentflowcode_Sendcredentials_Desc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_consentflowcode_sendcredentials_desc4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Consentflowcode_Sendcredentials_Desc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Consentflowcode_Sendcredentials_Desc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_consentflowcode_sendcredentials_desc4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_consentflowcode_sendcredentials_desc4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_consentflowcode_sendcredentials_desc4(inputs)
	return ar_developerportal_dashboards_tabs_consentflowcode_sendcredentials_desc4(inputs)
});
export { developerportal_dashboards_tabs_consentflowcode_sendcredentials_desc4 as "developerPortal.dashboards.tabs.consentFlowCode.sendCredentials.desc" }