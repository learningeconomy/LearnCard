/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Csvupload_Notemplatesavailable4Inputs */

const en_developerportal_dashboards_tabs_csvupload_notemplatesavailable4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Notemplatesavailable4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No templates available`)
};

const es_developerportal_dashboards_tabs_csvupload_notemplatesavailable4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Notemplatesavailable4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No hay plantillas disponibles`)
};

const fr_developerportal_dashboards_tabs_csvupload_notemplatesavailable4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Notemplatesavailable4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun modèle disponible`)
};

const ar_developerportal_dashboards_tabs_csvupload_notemplatesavailable4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Notemplatesavailable4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد قوالب متاحة`)
};

/**
* | output |
* | --- |
* | "No templates available" |
*
* @param {Developerportal_Dashboards_Tabs_Csvupload_Notemplatesavailable4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_csvupload_notemplatesavailable4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Csvupload_Notemplatesavailable4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Csvupload_Notemplatesavailable4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_csvupload_notemplatesavailable4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_csvupload_notemplatesavailable4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_csvupload_notemplatesavailable4(inputs)
	return ar_developerportal_dashboards_tabs_csvupload_notemplatesavailable4(inputs)
});
export { developerportal_dashboards_tabs_csvupload_notemplatesavailable4 as "developerPortal.dashboards.tabs.csvUpload.noTemplatesAvailable" }