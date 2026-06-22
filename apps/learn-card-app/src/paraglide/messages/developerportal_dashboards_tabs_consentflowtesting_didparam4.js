/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Consentflowtesting_Didparam4Inputs */

const en_developerportal_dashboards_tabs_consentflowtesting_didparam4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Didparam4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`did`)
};

const es_developerportal_dashboards_tabs_consentflowtesting_didparam4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Didparam4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`did`)
};

const fr_developerportal_dashboards_tabs_consentflowtesting_didparam4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Didparam4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`did`)
};

const ar_developerportal_dashboards_tabs_consentflowtesting_didparam4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Didparam4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`did`)
};

/**
* | output |
* | --- |
* | "did" |
*
* @param {Developerportal_Dashboards_Tabs_Consentflowtesting_Didparam4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_consentflowtesting_didparam4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Consentflowtesting_Didparam4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Consentflowtesting_Didparam4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_consentflowtesting_didparam4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_consentflowtesting_didparam4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_consentflowtesting_didparam4(inputs)
	return ar_developerportal_dashboards_tabs_consentflowtesting_didparam4(inputs)
});
export { developerportal_dashboards_tabs_consentflowtesting_didparam4 as "developerPortal.dashboards.tabs.consentFlowTesting.didParam" }