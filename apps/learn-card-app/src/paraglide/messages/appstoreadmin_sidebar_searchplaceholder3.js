/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appstoreadmin_Sidebar_Searchplaceholder3Inputs */

const en_appstoreadmin_sidebar_searchplaceholder3 = /** @type {(inputs: Appstoreadmin_Sidebar_Searchplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Search apps...`)
};

const es_appstoreadmin_sidebar_searchplaceholder3 = /** @type {(inputs: Appstoreadmin_Sidebar_Searchplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Buscar apps...`)
};

const fr_appstoreadmin_sidebar_searchplaceholder3 = /** @type {(inputs: Appstoreadmin_Sidebar_Searchplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rechercher des apps...`)
};

const ar_appstoreadmin_sidebar_searchplaceholder3 = /** @type {(inputs: Appstoreadmin_Sidebar_Searchplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`البحث عن التطبيقات...`)
};

/**
* | output |
* | --- |
* | "Search apps..." |
*
* @param {Appstoreadmin_Sidebar_Searchplaceholder3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appstoreadmin_sidebar_searchplaceholder3 = /** @type {((inputs?: Appstoreadmin_Sidebar_Searchplaceholder3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appstoreadmin_Sidebar_Searchplaceholder3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appstoreadmin_sidebar_searchplaceholder3(inputs)
	if (locale === "es") return es_appstoreadmin_sidebar_searchplaceholder3(inputs)
	if (locale === "fr") return fr_appstoreadmin_sidebar_searchplaceholder3(inputs)
	return ar_appstoreadmin_sidebar_searchplaceholder3(inputs)
});
export { appstoreadmin_sidebar_searchplaceholder3 as "appStoreAdmin.sidebar.searchPlaceholder" }