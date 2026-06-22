/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Consentflowtesting_Recipientdidhint5Inputs */

const en_developerportal_dashboards_tabs_consentflowtesting_recipientdidhint5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Recipientdidhint5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`(from consent callback)`)
};

const es_developerportal_dashboards_tabs_consentflowtesting_recipientdidhint5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Recipientdidhint5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`(del callback de consentimiento)`)
};

const fr_developerportal_dashboards_tabs_consentflowtesting_recipientdidhint5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Recipientdidhint5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`(du callback de consentement)`)
};

const ar_developerportal_dashboards_tabs_consentflowtesting_recipientdidhint5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Recipientdidhint5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`(من استدعاء الموافقة)`)
};

/**
* | output |
* | --- |
* | "(from consent callback)" |
*
* @param {Developerportal_Dashboards_Tabs_Consentflowtesting_Recipientdidhint5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_consentflowtesting_recipientdidhint5 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Consentflowtesting_Recipientdidhint5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Consentflowtesting_Recipientdidhint5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_consentflowtesting_recipientdidhint5(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_consentflowtesting_recipientdidhint5(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_consentflowtesting_recipientdidhint5(inputs)
	return ar_developerportal_dashboards_tabs_consentflowtesting_recipientdidhint5(inputs)
});
export { developerportal_dashboards_tabs_consentflowtesting_recipientdidhint5 as "developerPortal.dashboards.tabs.consentFlowTesting.recipientDidHint" }