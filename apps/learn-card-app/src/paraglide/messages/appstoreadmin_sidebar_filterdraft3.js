/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appstoreadmin_Sidebar_Filterdraft3Inputs */

const en_appstoreadmin_sidebar_filterdraft3 = /** @type {(inputs: Appstoreadmin_Sidebar_Filterdraft3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Draft`)
};

const es_appstoreadmin_sidebar_filterdraft3 = /** @type {(inputs: Appstoreadmin_Sidebar_Filterdraft3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Borrador`)
};

const fr_appstoreadmin_sidebar_filterdraft3 = /** @type {(inputs: Appstoreadmin_Sidebar_Filterdraft3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Brouillon`)
};

const ar_appstoreadmin_sidebar_filterdraft3 = /** @type {(inputs: Appstoreadmin_Sidebar_Filterdraft3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مسودة`)
};

/**
* | output |
* | --- |
* | "Draft" |
*
* @param {Appstoreadmin_Sidebar_Filterdraft3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appstoreadmin_sidebar_filterdraft3 = /** @type {((inputs?: Appstoreadmin_Sidebar_Filterdraft3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appstoreadmin_Sidebar_Filterdraft3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appstoreadmin_sidebar_filterdraft3(inputs)
	if (locale === "es") return es_appstoreadmin_sidebar_filterdraft3(inputs)
	if (locale === "fr") return fr_appstoreadmin_sidebar_filterdraft3(inputs)
	return ar_appstoreadmin_sidebar_filterdraft3(inputs)
});
export { appstoreadmin_sidebar_filterdraft3 as "appStoreAdmin.sidebar.filterDraft" }