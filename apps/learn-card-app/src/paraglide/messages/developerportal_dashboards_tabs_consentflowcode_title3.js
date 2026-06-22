/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Consentflowcode_Title3Inputs */

const en_developerportal_dashboards_tabs_consentflowcode_title3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Integration Code`)
};

const es_developerportal_dashboards_tabs_consentflowcode_title3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Código de Integración`)
};

const fr_developerportal_dashboards_tabs_consentflowcode_title3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Code d'Intégration`)
};

const ar_developerportal_dashboards_tabs_consentflowcode_title3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`كود التكامل`)
};

/**
* | output |
* | --- |
* | "Integration Code" |
*
* @param {Developerportal_Dashboards_Tabs_Consentflowcode_Title3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_consentflowcode_title3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Consentflowcode_Title3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Consentflowcode_Title3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_consentflowcode_title3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_consentflowcode_title3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_consentflowcode_title3(inputs)
	return ar_developerportal_dashboards_tabs_consentflowcode_title3(inputs)
});
export { developerportal_dashboards_tabs_consentflowcode_title3 as "developerPortal.dashboards.tabs.consentFlowCode.title" }