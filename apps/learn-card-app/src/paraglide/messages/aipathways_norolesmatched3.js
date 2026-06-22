/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aipathways_Norolesmatched3Inputs */

const en_aipathways_norolesmatched3 = /** @type {(inputs: Aipathways_Norolesmatched3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No roles matched your search. Try a broader keyword.`)
};

const es_aipathways_norolesmatched3 = /** @type {(inputs: Aipathways_Norolesmatched3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ningún rol coincide con tu búsqueda. Prueba con una palabra clave más general.`)
};

const fr_aipathways_norolesmatched3 = /** @type {(inputs: Aipathways_Norolesmatched3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun rôle ne correspond à votre recherche. Essayez un mot-clé plus général.`)
};

const ar_aipathways_norolesmatched3 = /** @type {(inputs: Aipathways_Norolesmatched3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد أدوار تطابق بحثك. جرّب كلمة مفتاحية أوسع.`)
};

/**
* | output |
* | --- |
* | "No roles matched your search. Try a broader keyword." |
*
* @param {Aipathways_Norolesmatched3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aipathways_norolesmatched3 = /** @type {((inputs?: Aipathways_Norolesmatched3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aipathways_Norolesmatched3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aipathways_norolesmatched3(inputs)
	if (locale === "es") return es_aipathways_norolesmatched3(inputs)
	if (locale === "fr") return fr_aipathways_norolesmatched3(inputs)
	return ar_aipathways_norolesmatched3(inputs)
});
export { aipathways_norolesmatched3 as "aiPathways.noRolesMatched" }