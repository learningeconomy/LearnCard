/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Consentflowtesting_Missingconfig4Inputs */

const en_developerportal_dashboards_tabs_consentflowtesting_missingconfig4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Missingconfig4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Missing configuration`)
};

const es_developerportal_dashboards_tabs_consentflowtesting_missingconfig4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Missingconfig4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configuración faltante`)
};

const fr_developerportal_dashboards_tabs_consentflowtesting_missingconfig4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Missingconfig4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configuration manquante`)
};

const ar_developerportal_dashboards_tabs_consentflowtesting_missingconfig4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Missingconfig4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تكوين مفقود`)
};

/**
* | output |
* | --- |
* | "Missing configuration" |
*
* @param {Developerportal_Dashboards_Tabs_Consentflowtesting_Missingconfig4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_consentflowtesting_missingconfig4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Consentflowtesting_Missingconfig4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Consentflowtesting_Missingconfig4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_consentflowtesting_missingconfig4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_consentflowtesting_missingconfig4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_consentflowtesting_missingconfig4(inputs)
	return ar_developerportal_dashboards_tabs_consentflowtesting_missingconfig4(inputs)
});
export { developerportal_dashboards_tabs_consentflowtesting_missingconfig4 as "developerPortal.dashboards.tabs.consentFlowTesting.missingConfig" }