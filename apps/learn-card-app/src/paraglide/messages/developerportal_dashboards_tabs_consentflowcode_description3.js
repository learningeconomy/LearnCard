/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Consentflowcode_Description3Inputs */

const en_developerportal_dashboards_tabs_consentflowcode_description3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Code snippets and configuration for your consent flow integration`)
};

const es_developerportal_dashboards_tabs_consentflowcode_description3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fragmentos de código y configuración para tu integración de flujo de consentimiento`)
};

const fr_developerportal_dashboards_tabs_consentflowcode_description3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Extraits de code et configuration pour votre intégration de flux de consentement`)
};

const ar_developerportal_dashboards_tabs_consentflowcode_description3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Consentflowcode_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مقتطفات الكود والإعدادات لتكامل تدفق الموافقة الخاص بك`)
};

/**
* | output |
* | --- |
* | "Code snippets and configuration for your consent flow integration" |
*
* @param {Developerportal_Dashboards_Tabs_Consentflowcode_Description3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_consentflowcode_description3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Consentflowcode_Description3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Consentflowcode_Description3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_consentflowcode_description3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_consentflowcode_description3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_consentflowcode_description3(inputs)
	return ar_developerportal_dashboards_tabs_consentflowcode_description3(inputs)
});
export { developerportal_dashboards_tabs_consentflowcode_description3 as "developerPortal.dashboards.tabs.consentFlowCode.description" }