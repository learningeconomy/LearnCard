/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Testing_Templatesnotsaved3Inputs */

const en_developerportal_dashboards_tabs_testing_templatesnotsaved3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Templatesnotsaved3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Some templates not saved`)
};

const es_developerportal_dashboards_tabs_testing_templatesnotsaved3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Templatesnotsaved3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Algunas plantillas no guardadas`)
};

const fr_developerportal_dashboards_tabs_testing_templatesnotsaved3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Templatesnotsaved3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Certains modèles non sauvegardés`)
};

const ar_developerportal_dashboards_tabs_testing_templatesnotsaved3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Testing_Templatesnotsaved3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بعض القوالب غير محفوظة`)
};

/**
* | output |
* | --- |
* | "Some templates not saved" |
*
* @param {Developerportal_Dashboards_Tabs_Testing_Templatesnotsaved3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_testing_templatesnotsaved3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Testing_Templatesnotsaved3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Testing_Templatesnotsaved3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_testing_templatesnotsaved3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_testing_templatesnotsaved3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_testing_templatesnotsaved3(inputs)
	return ar_developerportal_dashboards_tabs_testing_templatesnotsaved3(inputs)
});
export { developerportal_dashboards_tabs_testing_templatesnotsaved3 as "developerPortal.dashboards.tabs.testing.templatesNotSaved" }