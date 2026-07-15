/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Auth_Noresults1Inputs */

const en_auth_noresults1 = /** @type {(inputs: Auth_Noresults1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No search results yet`)
};

const es_auth_noresults1 = /** @type {(inputs: Auth_Noresults1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún no hay resultados de búsqueda`)
};

const fr_auth_noresults1 = /** @type {(inputs: Auth_Noresults1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun résultat de recherche pour l'instant`)
};

const ar_auth_noresults1 = /** @type {(inputs: Auth_Noresults1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد نتائج بحث بعد`)
};

/**
* | output |
* | --- |
* | "No search results yet" |
*
* @param {Auth_Noresults1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const auth_noresults1 = /** @type {((inputs?: Auth_Noresults1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Noresults1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_auth_noresults1(inputs)
	if (locale === "es") return es_auth_noresults1(inputs)
	if (locale === "fr") return fr_auth_noresults1(inputs)
	return ar_auth_noresults1(inputs)
});
export { auth_noresults1 as "auth.noResults" }