/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Consentflowtesting_Sendingcredential4Inputs */

const en_developerportal_dashboards_tabs_consentflowtesting_sendingcredential4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Sendingcredential4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sending credential...`)
};

const es_developerportal_dashboards_tabs_consentflowtesting_sendingcredential4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Sendingcredential4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enviando credencial...`)
};

const fr_developerportal_dashboards_tabs_consentflowtesting_sendingcredential4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Sendingcredential4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envoi du credential...`)
};

const ar_developerportal_dashboards_tabs_consentflowtesting_sendingcredential4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Sendingcredential4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ إرسال بيانات الاعتماد...`)
};

/**
* | output |
* | --- |
* | "Sending credential..." |
*
* @param {Developerportal_Dashboards_Tabs_Consentflowtesting_Sendingcredential4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_consentflowtesting_sendingcredential4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Consentflowtesting_Sendingcredential4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Consentflowtesting_Sendingcredential4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_consentflowtesting_sendingcredential4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_consentflowtesting_sendingcredential4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_consentflowtesting_sendingcredential4(inputs)
	return ar_developerportal_dashboards_tabs_consentflowtesting_sendingcredential4(inputs)
});
export { developerportal_dashboards_tabs_consentflowtesting_sendingcredential4 as "developerPortal.dashboards.tabs.consentFlowTesting.sendingCredential" }