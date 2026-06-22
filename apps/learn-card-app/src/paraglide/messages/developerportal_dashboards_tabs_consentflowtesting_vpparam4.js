/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Consentflowtesting_Vpparam4Inputs */

const en_developerportal_dashboards_tabs_consentflowtesting_vpparam4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Vpparam4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`vp`)
};

const es_developerportal_dashboards_tabs_consentflowtesting_vpparam4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Vpparam4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`vp`)
};

const fr_developerportal_dashboards_tabs_consentflowtesting_vpparam4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Vpparam4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`vp`)
};

const ar_developerportal_dashboards_tabs_consentflowtesting_vpparam4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Vpparam4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`vp`)
};

/**
* | output |
* | --- |
* | "vp" |
*
* @param {Developerportal_Dashboards_Tabs_Consentflowtesting_Vpparam4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_consentflowtesting_vpparam4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Consentflowtesting_Vpparam4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Consentflowtesting_Vpparam4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_consentflowtesting_vpparam4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_consentflowtesting_vpparam4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_consentflowtesting_vpparam4(inputs)
	return ar_developerportal_dashboards_tabs_consentflowtesting_vpparam4(inputs)
});
export { developerportal_dashboards_tabs_consentflowtesting_vpparam4 as "developerPortal.dashboards.tabs.consentFlowTesting.vpParam" }