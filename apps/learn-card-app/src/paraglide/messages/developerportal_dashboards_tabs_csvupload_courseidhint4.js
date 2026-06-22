/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Dashboards_Tabs_Csvupload_Courseidhint4Inputs */

const en_developerportal_dashboards_tabs_csvupload_courseidhint4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Courseidhint4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`The "course id" column identifies which template to use per row (matches by name).`)
};

const es_developerportal_dashboards_tabs_csvupload_courseidhint4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Courseidhint4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`La columna "course id" identifica qué plantilla usar por fila (coincide por nombre).`)
};

const fr_developerportal_dashboards_tabs_csvupload_courseidhint4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Courseidhint4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`La colonne "course id" identifie quel modèle utiliser par ligne (correspondance par nom).`)
};

const ar_developerportal_dashboards_tabs_csvupload_courseidhint4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Courseidhint4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يحدد عمود "معرف الدورة" القالب الذي سيتم استخدامه لكل صف (يطابق حسب الاسم).`)
};

/**
* | output |
* | --- |
* | "The \"course id\" column identifies which template to use per row (matches by name)." |
*
* @param {Developerportal_Dashboards_Tabs_Csvupload_Courseidhint4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_csvupload_courseidhint4 = /** @type {((inputs?: Developerportal_Dashboards_Tabs_Csvupload_Courseidhint4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Csvupload_Courseidhint4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_csvupload_courseidhint4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_csvupload_courseidhint4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_csvupload_courseidhint4(inputs)
	return ar_developerportal_dashboards_tabs_csvupload_courseidhint4(inputs)
});
export { developerportal_dashboards_tabs_csvupload_courseidhint4 as "developerPortal.dashboards.tabs.csvUpload.courseIdHint" }