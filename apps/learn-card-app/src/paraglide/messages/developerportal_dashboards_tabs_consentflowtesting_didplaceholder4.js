/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Consentflowtesting_Didplaceholder4Inputs */

const en_developerportal_dashboards_tabs_consentflowtesting_didplaceholder4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Didplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`did:web:... or did:key:...`)
};

const es_developerportal_dashboards_tabs_consentflowtesting_didplaceholder4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Didplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`did:web:... o did:key:...`)
};

const fr_developerportal_dashboards_tabs_consentflowtesting_didplaceholder4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Didplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`did:web:... ou did:key:...`)
};

const ar_developerportal_dashboards_tabs_consentflowtesting_didplaceholder4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Didplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`did:web:... أو did:key:...`)
};

/**
* | output |
* | --- |
* | "did:web:... or did:key:..." |
*
* @param {Developerportal_Dashboards_Tabs_Consentflowtesting_Didplaceholder4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_consentflowtesting_didplaceholder4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Consentflowtesting_Didplaceholder4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Consentflowtesting_Didplaceholder4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_consentflowtesting_didplaceholder4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_consentflowtesting_didplaceholder4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_consentflowtesting_didplaceholder4(inputs)
	return ar_developerportal_dashboards_tabs_consentflowtesting_didplaceholder4(inputs)
});
export { developerportal_dashboards_tabs_consentflowtesting_didplaceholder4 as "developerPortal.dashboards.tabs.consentFlowTesting.didPlaceholder" }