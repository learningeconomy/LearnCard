/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Growskills_Noresults2Inputs */

const en_growskills_noresults2 = /** @type {(inputs: Growskills_Noresults2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No results found. Try a broader search term.`)
};

const es_growskills_noresults2 = /** @type {(inputs: Growskills_Noresults2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se encontraron resultados. Prueba con un término de búsqueda más amplio.`)
};

const fr_growskills_noresults2 = /** @type {(inputs: Growskills_Noresults2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun résultat trouvé. Essayez un terme de recherche plus large.`)
};

const ar_growskills_noresults2 = /** @type {(inputs: Growskills_Noresults2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد نتائج. جرّب مصطلح بحث أوسع.`)
};

/**
* | output |
* | --- |
* | "No results found. Try a broader search term." |
*
* @param {Growskills_Noresults2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const growskills_noresults2 = /** @type {((inputs?: Growskills_Noresults2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Growskills_Noresults2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_growskills_noresults2(inputs)
	if (locale === "es") return es_growskills_noresults2(inputs)
	if (locale === "fr") return fr_growskills_noresults2(inputs)
	return ar_growskills_noresults2(inputs)
});
export { growskills_noresults2 as "growSkills.noResults" }