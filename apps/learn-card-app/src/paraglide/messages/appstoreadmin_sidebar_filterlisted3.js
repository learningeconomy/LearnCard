/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appstoreadmin_Sidebar_Filterlisted3Inputs */

const en_appstoreadmin_sidebar_filterlisted3 = /** @type {(inputs: Appstoreadmin_Sidebar_Filterlisted3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Listed`)
};

const es_appstoreadmin_sidebar_filterlisted3 = /** @type {(inputs: Appstoreadmin_Sidebar_Filterlisted3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Publicadas`)
};

const fr_appstoreadmin_sidebar_filterlisted3 = /** @type {(inputs: Appstoreadmin_Sidebar_Filterlisted3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Publiées`)
};

const ar_appstoreadmin_sidebar_filterlisted3 = /** @type {(inputs: Appstoreadmin_Sidebar_Filterlisted3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`منشورة`)
};

/**
* | output |
* | --- |
* | "Listed" |
*
* @param {Appstoreadmin_Sidebar_Filterlisted3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appstoreadmin_sidebar_filterlisted3 = /** @type {((inputs?: Appstoreadmin_Sidebar_Filterlisted3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appstoreadmin_Sidebar_Filterlisted3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appstoreadmin_sidebar_filterlisted3(inputs)
	if (locale === "es") return es_appstoreadmin_sidebar_filterlisted3(inputs)
	if (locale === "fr") return fr_appstoreadmin_sidebar_filterlisted3(inputs)
	return ar_appstoreadmin_sidebar_filterlisted3(inputs)
});
export { appstoreadmin_sidebar_filterlisted3 as "appStoreAdmin.sidebar.filterListed" }