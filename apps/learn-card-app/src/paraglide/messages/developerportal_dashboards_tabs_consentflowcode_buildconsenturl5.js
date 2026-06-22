/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Consentflowcode_Buildconsenturl5Inputs */

const en_developerportal_dashboards_tabs_consentflowcode_buildconsenturl5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Buildconsenturl5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Build the consent URL`)
};

const es_developerportal_dashboards_tabs_consentflowcode_buildconsenturl5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Buildconsenturl5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crear la URL de consentimiento`)
};

const fr_developerportal_dashboards_tabs_consentflowcode_buildconsenturl5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Buildconsenturl5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Construire l'URL de consentement`)
};

const ar_developerportal_dashboards_tabs_consentflowcode_buildconsenturl5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Buildconsenturl5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بناء رابط الموافقة`)
};

/**
* | output |
* | --- |
* | "Build the consent URL" |
*
* @param {Developerportal_Dashboards_Tabs_Consentflowcode_Buildconsenturl5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_consentflowcode_buildconsenturl5 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Consentflowcode_Buildconsenturl5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Consentflowcode_Buildconsenturl5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_consentflowcode_buildconsenturl5(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_consentflowcode_buildconsenturl5(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_consentflowcode_buildconsenturl5(inputs)
	return ar_developerportal_dashboards_tabs_consentflowcode_buildconsenturl5(inputs)
});
export { developerportal_dashboards_tabs_consentflowcode_buildconsenturl5 as "developerPortal.dashboards.tabs.consentFlowCode.buildConsentUrl" }