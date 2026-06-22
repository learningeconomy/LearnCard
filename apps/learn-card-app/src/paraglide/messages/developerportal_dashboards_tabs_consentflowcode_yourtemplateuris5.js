/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Consentflowcode_Yourtemplateuris5Inputs */

const en_developerportal_dashboards_tabs_consentflowcode_yourtemplateuris5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Yourtemplateuris5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your Template URIs:`)
};

const es_developerportal_dashboards_tabs_consentflowcode_yourtemplateuris5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Yourtemplateuris5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tus URI de Plantillas:`)
};

const fr_developerportal_dashboards_tabs_consentflowcode_yourtemplateuris5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Yourtemplateuris5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vos URI de Modèles :`)
};

const ar_developerportal_dashboards_tabs_consentflowcode_yourtemplateuris5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Yourtemplateuris5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`روابط القوالب الخاصة بك:`)
};

/**
* | output |
* | --- |
* | "Your Template URIs:" |
*
* @param {Developerportal_Dashboards_Tabs_Consentflowcode_Yourtemplateuris5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_consentflowcode_yourtemplateuris5 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Consentflowcode_Yourtemplateuris5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Consentflowcode_Yourtemplateuris5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_consentflowcode_yourtemplateuris5(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_consentflowcode_yourtemplateuris5(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_consentflowcode_yourtemplateuris5(inputs)
	return ar_developerportal_dashboards_tabs_consentflowcode_yourtemplateuris5(inputs)
});
export { developerportal_dashboards_tabs_consentflowcode_yourtemplateuris5 as "developerPortal.dashboards.tabs.consentFlowCode.yourTemplateUris" }