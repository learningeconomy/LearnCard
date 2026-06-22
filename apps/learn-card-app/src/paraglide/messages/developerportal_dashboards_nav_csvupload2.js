/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Nav_Csvupload2Inputs */

const en_developerportal_dashboards_nav_csvupload2 = /** @type {(inputs: Developerportal_Dashboards_Nav_Csvupload2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`CSV Upload`)
};

const es_developerportal_dashboards_nav_csvupload2 = /** @type {(inputs: Developerportal_Dashboards_Nav_Csvupload2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Subir CSV`)
};

const fr_developerportal_dashboards_nav_csvupload2 = /** @type {(inputs: Developerportal_Dashboards_Nav_Csvupload2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Importer CSV`)
};

const ar_developerportal_dashboards_nav_csvupload2 = /** @type {(inputs: Developerportal_Dashboards_Nav_Csvupload2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رفع CSV`)
};

/**
* | output |
* | --- |
* | "CSV Upload" |
*
* @param {Developerportal_Dashboards_Nav_Csvupload2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_nav_csvupload2 = /** @type {((inputs?: Developerportal_Dashboards_Nav_Csvupload2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Nav_Csvupload2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_nav_csvupload2(inputs)
	if (locale === "es") return es_developerportal_dashboards_nav_csvupload2(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_nav_csvupload2(inputs)
	return ar_developerportal_dashboards_nav_csvupload2(inputs)
});
export { developerportal_dashboards_nav_csvupload2 as "developerPortal.dashboards.nav.csvUpload" }