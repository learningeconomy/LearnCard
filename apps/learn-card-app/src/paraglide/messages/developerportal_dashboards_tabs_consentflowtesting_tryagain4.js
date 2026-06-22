/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Consentflowtesting_Tryagain4Inputs */

const en_developerportal_dashboards_tabs_consentflowtesting_tryagain4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Tryagain4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Try Again`)
};

const es_developerportal_dashboards_tabs_consentflowtesting_tryagain4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Tryagain4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Intentar de Nuevo`)
};

const fr_developerportal_dashboards_tabs_consentflowtesting_tryagain4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Tryagain4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Réessayer`)
};

const ar_developerportal_dashboards_tabs_consentflowtesting_tryagain4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Tryagain4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حاول مرة أخرى`)
};

/**
* | output |
* | --- |
* | "Try Again" |
*
* @param {Developerportal_Dashboards_Tabs_Consentflowtesting_Tryagain4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_consentflowtesting_tryagain4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Consentflowtesting_Tryagain4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Consentflowtesting_Tryagain4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_consentflowtesting_tryagain4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_consentflowtesting_tryagain4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_consentflowtesting_tryagain4(inputs)
	return ar_developerportal_dashboards_tabs_consentflowtesting_tryagain4(inputs)
});
export { developerportal_dashboards_tabs_consentflowtesting_tryagain4 as "developerPortal.dashboards.tabs.consentFlowTesting.tryAgain" }