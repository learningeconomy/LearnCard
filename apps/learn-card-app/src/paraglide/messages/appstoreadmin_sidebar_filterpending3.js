/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appstoreadmin_Sidebar_Filterpending3Inputs */

const en_appstoreadmin_sidebar_filterpending3 = /** @type {(inputs: Appstoreadmin_Sidebar_Filterpending3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pending`)
};

const es_appstoreadmin_sidebar_filterpending3 = /** @type {(inputs: Appstoreadmin_Sidebar_Filterpending3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pendiente`)
};

const fr_appstoreadmin_sidebar_filterpending3 = /** @type {(inputs: Appstoreadmin_Sidebar_Filterpending3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`En attente`)
};

const ar_appstoreadmin_sidebar_filterpending3 = /** @type {(inputs: Appstoreadmin_Sidebar_Filterpending3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قيد المراجعة`)
};

/**
* | output |
* | --- |
* | "Pending" |
*
* @param {Appstoreadmin_Sidebar_Filterpending3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appstoreadmin_sidebar_filterpending3 = /** @type {((inputs?: Appstoreadmin_Sidebar_Filterpending3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appstoreadmin_Sidebar_Filterpending3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appstoreadmin_sidebar_filterpending3(inputs)
	if (locale === "es") return es_appstoreadmin_sidebar_filterpending3(inputs)
	if (locale === "fr") return fr_appstoreadmin_sidebar_filterpending3(inputs)
	return ar_appstoreadmin_sidebar_filterpending3(inputs)
});
export { appstoreadmin_sidebar_filterpending3 as "appStoreAdmin.sidebar.filterPending" }