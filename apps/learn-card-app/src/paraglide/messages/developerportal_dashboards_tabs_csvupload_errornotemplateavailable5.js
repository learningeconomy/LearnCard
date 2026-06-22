/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Csvupload_Errornotemplateavailable5Inputs */

const en_developerportal_dashboards_tabs_csvupload_errornotemplateavailable5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Errornotemplateavailable5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No template available`)
};

const es_developerportal_dashboards_tabs_csvupload_errornotemplateavailable5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Errornotemplateavailable5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No hay plantilla disponible`)
};

const fr_developerportal_dashboards_tabs_csvupload_errornotemplateavailable5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Errornotemplateavailable5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun modèle disponible`)
};

const ar_developerportal_dashboards_tabs_csvupload_errornotemplateavailable5 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Errornotemplateavailable5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا يوجد قالب متاح`)
};

/**
* | output |
* | --- |
* | "No template available" |
*
* @param {Developerportal_Dashboards_Tabs_Csvupload_Errornotemplateavailable5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_csvupload_errornotemplateavailable5 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Csvupload_Errornotemplateavailable5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Csvupload_Errornotemplateavailable5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_csvupload_errornotemplateavailable5(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_csvupload_errornotemplateavailable5(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_csvupload_errornotemplateavailable5(inputs)
	return ar_developerportal_dashboards_tabs_csvupload_errornotemplateavailable5(inputs)
});
export { developerportal_dashboards_tabs_csvupload_errornotemplateavailable5 as "developerPortal.dashboards.tabs.csvUpload.errorNoTemplateAvailable" }