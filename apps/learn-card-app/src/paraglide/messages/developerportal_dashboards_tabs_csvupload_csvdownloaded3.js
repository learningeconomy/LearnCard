/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Csvupload_Csvdownloaded3Inputs */

const en_developerportal_dashboards_tabs_csvupload_csvdownloaded3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Csvdownloaded3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`CSV template downloaded!`)
};

const es_developerportal_dashboards_tabs_csvupload_csvdownloaded3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Csvdownloaded3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Plantilla CSV descargada!`)
};

const fr_developerportal_dashboards_tabs_csvupload_csvdownloaded3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Csvdownloaded3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modèle CSV téléchargé !`)
};

const ar_developerportal_dashboards_tabs_csvupload_csvdownloaded3 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Csvdownloaded3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم تنزيل قالب CSV!`)
};

/**
* | output |
* | --- |
* | "CSV template downloaded!" |
*
* @param {Developerportal_Dashboards_Tabs_Csvupload_Csvdownloaded3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_csvupload_csvdownloaded3 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Csvupload_Csvdownloaded3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Csvupload_Csvdownloaded3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_csvupload_csvdownloaded3(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_csvupload_csvdownloaded3(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_csvupload_csvdownloaded3(inputs)
	return ar_developerportal_dashboards_tabs_csvupload_csvdownloaded3(inputs)
});
export { developerportal_dashboards_tabs_csvupload_csvdownloaded3 as "developerPortal.dashboards.tabs.csvUpload.csvDownloaded" }