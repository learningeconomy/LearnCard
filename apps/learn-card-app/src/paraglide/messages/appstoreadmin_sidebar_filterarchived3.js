/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appstoreadmin_Sidebar_Filterarchived3Inputs */

const en_appstoreadmin_sidebar_filterarchived3 = /** @type {(inputs: Appstoreadmin_Sidebar_Filterarchived3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Archived`)
};

const es_appstoreadmin_sidebar_filterarchived3 = /** @type {(inputs: Appstoreadmin_Sidebar_Filterarchived3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Archivadas`)
};

const fr_appstoreadmin_sidebar_filterarchived3 = /** @type {(inputs: Appstoreadmin_Sidebar_Filterarchived3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Archivées`)
};

const ar_appstoreadmin_sidebar_filterarchived3 = /** @type {(inputs: Appstoreadmin_Sidebar_Filterarchived3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مؤرشفة`)
};

/**
* | output |
* | --- |
* | "Archived" |
*
* @param {Appstoreadmin_Sidebar_Filterarchived3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appstoreadmin_sidebar_filterarchived3 = /** @type {((inputs?: Appstoreadmin_Sidebar_Filterarchived3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appstoreadmin_Sidebar_Filterarchived3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appstoreadmin_sidebar_filterarchived3(inputs)
	if (locale === "es") return es_appstoreadmin_sidebar_filterarchived3(inputs)
	if (locale === "fr") return fr_appstoreadmin_sidebar_filterarchived3(inputs)
	return ar_appstoreadmin_sidebar_filterarchived3(inputs)
});
export { appstoreadmin_sidebar_filterarchived3 as "appStoreAdmin.sidebar.filterArchived" }