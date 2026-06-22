/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Consentflowtesting_Consenturl4Inputs */

const en_developerportal_dashboards_tabs_consentflowtesting_consenturl4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Consenturl4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Consent URL:`)
};

const es_developerportal_dashboards_tabs_consentflowtesting_consenturl4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Consenturl4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL de Consentimiento:`)
};

const fr_developerportal_dashboards_tabs_consentflowtesting_consenturl4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Consenturl4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`URL de Consentement :`)
};

const ar_developerportal_dashboards_tabs_consentflowtesting_consenturl4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Consenturl4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رابط الموافقة:`)
};

/**
* | output |
* | --- |
* | "Consent URL:" |
*
* @param {Developerportal_Dashboards_Tabs_Consentflowtesting_Consenturl4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_consentflowtesting_consenturl4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Consentflowtesting_Consenturl4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Consentflowtesting_Consenturl4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_consentflowtesting_consenturl4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_consentflowtesting_consenturl4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_consentflowtesting_consenturl4(inputs)
	return ar_developerportal_dashboards_tabs_consentflowtesting_consenturl4(inputs)
});
export { developerportal_dashboards_tabs_consentflowtesting_consenturl4 as "developerPortal.dashboards.tabs.consentFlowTesting.consentUrl" }