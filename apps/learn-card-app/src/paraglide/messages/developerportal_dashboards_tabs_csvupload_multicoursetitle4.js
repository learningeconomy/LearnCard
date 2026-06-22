/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Csvupload_Multicoursetitle4Inputs */

const en_developerportal_dashboards_tabs_csvupload_multicoursetitle4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Multicoursetitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Multi-Course Batch Mode`)
};

const es_developerportal_dashboards_tabs_csvupload_multicoursetitle4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Multicoursetitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modo de Lote Multi-Curso`)
};

const fr_developerportal_dashboards_tabs_csvupload_multicoursetitle4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Multicoursetitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mode Lot Multi-Cours`)
};

const ar_developerportal_dashboards_tabs_csvupload_multicoursetitle4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Multicoursetitle4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`وضع الدفعة متعددة الدورات`)
};

/**
* | output |
* | --- |
* | "Multi-Course Batch Mode" |
*
* @param {Developerportal_Dashboards_Tabs_Csvupload_Multicoursetitle4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_csvupload_multicoursetitle4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Csvupload_Multicoursetitle4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Csvupload_Multicoursetitle4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_csvupload_multicoursetitle4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_csvupload_multicoursetitle4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_csvupload_multicoursetitle4(inputs)
	return ar_developerportal_dashboards_tabs_csvupload_multicoursetitle4(inputs)
});
export { developerportal_dashboards_tabs_csvupload_multicoursetitle4 as "developerPortal.dashboards.tabs.csvUpload.multiCourseTitle" }