/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Launchfeature_Description3Inputs */

const en_developerportal_dashboards_tabs_partnerconnect_methods_launchfeature_description3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Launchfeature_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Navigate the LearnCard wallet to a specific feature or page. This allows your app to integrate with wallet features like viewing credentials, managing contacts, or accessing settings.`)
};

const es_developerportal_dashboards_tabs_partnerconnect_methods_launchfeature_description3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Launchfeature_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[Navigate the LearnCard wallet to a specific feature or page. This allows your app to integrate with wallet features like viewing credentials, managing contacts, or accessing settings.]`)
};

const fr_developerportal_dashboards_tabs_partnerconnect_methods_launchfeature_description3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Launchfeature_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[Navigate the LearnCard wallet to a specific feature or page. This allows your app to integrate with wallet features like viewing credentials, managing contacts, or accessing settings.]`)
};

const ar_developerportal_dashboards_tabs_partnerconnect_methods_launchfeature_description3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Launchfeature_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`[Navigate the LearnCard wallet to a specific feature or page. This allows your app to integrate with wallet features like viewing credentials, managing contacts, or accessing settings.]`)
};

/**
* | output |
* | --- |
* | "Navigate the LearnCard wallet to a specific feature or page. This allows your app to integrate with wallet features like viewing credentials, managing contac..." |
*
* @param {Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Launchfeature_Description3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_partnerconnect_methods_launchfeature_description3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Launchfeature_Description3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Partnerconnect_Methods_Launchfeature_Description3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_partnerconnect_methods_launchfeature_description3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_partnerconnect_methods_launchfeature_description3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_partnerconnect_methods_launchfeature_description3(inputs)
	return ar_developerportal_dashboards_tabs_partnerconnect_methods_launchfeature_description3(inputs)
});
export { developerportal_dashboards_tabs_partnerconnect_methods_launchfeature_description3 as "developerPortal.dashboards.tabs.partnerConnect.methods.launchFeature.description" }