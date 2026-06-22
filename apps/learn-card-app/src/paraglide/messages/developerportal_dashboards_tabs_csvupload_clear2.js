/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Csvupload_Clear2Inputs */

const en_developerportal_dashboards_tabs_csvupload_clear2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Clear2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Clear`)
};

const es_developerportal_dashboards_tabs_csvupload_clear2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Clear2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Limpiar`)
};

const fr_developerportal_dashboards_tabs_csvupload_clear2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Clear2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Effacer`)
};

const ar_developerportal_dashboards_tabs_csvupload_clear2 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Clear2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مسح`)
};

/**
* | output |
* | --- |
* | "Clear" |
*
* @param {Developerportal_Dashboards_Tabs_Csvupload_Clear2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_csvupload_clear2 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Csvupload_Clear2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Csvupload_Clear2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_csvupload_clear2(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_csvupload_clear2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_csvupload_clear2(inputs)
	return ar_developerportal_dashboards_tabs_csvupload_clear2(inputs)
});
export { developerportal_dashboards_tabs_csvupload_clear2 as "developerPortal.dashboards.tabs.csvUpload.clear" }