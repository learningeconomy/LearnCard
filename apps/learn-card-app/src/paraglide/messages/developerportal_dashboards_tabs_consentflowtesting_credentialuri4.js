/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ uri: NonNullable<unknown> }} Developerportal_Dashboards_Tabs_Consentflowtesting_Credentialuri4Inputs */

const en_developerportal_dashboards_tabs_consentflowtesting_credentialuri4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Credentialuri4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`URI: ${i?.uri}`)
};

const es_developerportal_dashboards_tabs_consentflowtesting_credentialuri4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Credentialuri4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`URI: ${i?.uri}`)
};

const fr_developerportal_dashboards_tabs_consentflowtesting_credentialuri4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Credentialuri4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`URI : ${i?.uri}`)
};

const ar_developerportal_dashboards_tabs_consentflowtesting_credentialuri4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Credentialuri4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`URI: ${i?.uri}`)
};

/**
* | output |
* | --- |
* | "URI: {uri}" |
*
* @param {Developerportal_Dashboards_Tabs_Consentflowtesting_Credentialuri4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_consentflowtesting_credentialuri4 = /** @type {((inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Credentialuri4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Consentflowtesting_Credentialuri4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_consentflowtesting_credentialuri4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_consentflowtesting_credentialuri4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_consentflowtesting_credentialuri4(inputs)
	return ar_developerportal_dashboards_tabs_consentflowtesting_credentialuri4(inputs)
});
export { developerportal_dashboards_tabs_consentflowtesting_credentialuri4 as "developerPortal.dashboards.tabs.consentFlowTesting.credentialUri" }