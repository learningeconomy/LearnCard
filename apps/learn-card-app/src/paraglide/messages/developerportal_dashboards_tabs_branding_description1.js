/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Branding_Description1Inputs */

const en_developerportal_dashboards_tabs_branding_description1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Customize how your organization appears on credentials`)
};

const es_developerportal_dashboards_tabs_branding_description1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Personaliza cómo aparece tu organización en las credenciales`)
};

const fr_developerportal_dashboards_tabs_branding_description1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Personnalisez l'apparence de votre organisation sur les credentials`)
};

const ar_developerportal_dashboards_tabs_branding_description1 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Branding_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تخصيص كيفية ظهور مؤسستك على بيانات الاعتماد`)
};

/**
* | output |
* | --- |
* | "Customize how your organization appears on credentials" |
*
* @param {Developerportal_Dashboards_Tabs_Branding_Description1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_branding_description1 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Branding_Description1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Branding_Description1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_branding_description1(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_branding_description1(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_branding_description1(inputs)
	return ar_developerportal_dashboards_tabs_branding_description1(inputs)
});
export { developerportal_dashboards_tabs_branding_description1 as "developerPortal.dashboards.tabs.branding.description" }