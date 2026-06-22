/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Consentflowtesting_Openconsentflow5Inputs */

const en_developerportal_dashboards_tabs_consentflowtesting_openconsentflow5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Openconsentflow5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Open Consent Flow`)
};

const es_developerportal_dashboards_tabs_consentflowtesting_openconsentflow5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Openconsentflow5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Abrir Flujo de Consentimiento`)
};

const fr_developerportal_dashboards_tabs_consentflowtesting_openconsentflow5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Openconsentflow5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ouvrir le Flux de Consentement`)
};

const ar_developerportal_dashboards_tabs_consentflowtesting_openconsentflow5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowtesting_Openconsentflow5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فتح تدفق الموافقة`)
};

/**
* | output |
* | --- |
* | "Open Consent Flow" |
*
* @param {Developerportal_Dashboards_Tabs_Consentflowtesting_Openconsentflow5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_consentflowtesting_openconsentflow5 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Consentflowtesting_Openconsentflow5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Consentflowtesting_Openconsentflow5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_consentflowtesting_openconsentflow5(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_consentflowtesting_openconsentflow5(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_consentflowtesting_openconsentflow5(inputs)
	return ar_developerportal_dashboards_tabs_consentflowtesting_openconsentflow5(inputs)
});
export { developerportal_dashboards_tabs_consentflowtesting_openconsentflow5 as "developerPortal.dashboards.tabs.consentFlowTesting.openConsentFlow" }