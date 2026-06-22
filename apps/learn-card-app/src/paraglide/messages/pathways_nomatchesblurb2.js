/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ query: NonNullable<unknown> }} Pathways_Nomatchesblurb2Inputs */

const en_pathways_nomatchesblurb2 = /** @type {(inputs: Pathways_Nomatchesblurb2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Nothing matches "${i?.query}". Try fewer words or clear the search.`)
};

const es_pathways_nomatchesblurb2 = /** @type {(inputs: Pathways_Nomatchesblurb2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Nada coincide con "${i?.query}". Prueba con menos palabras o borra la búsqueda.`)
};

const fr_pathways_nomatchesblurb2 = /** @type {(inputs: Pathways_Nomatchesblurb2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Rien ne correspond à « ${i?.query} ». Essayez moins de mots ou effacez la recherche.`)
};

const ar_pathways_nomatchesblurb2 = /** @type {(inputs: Pathways_Nomatchesblurb2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`لا شيء يطابق « ${i?.query} ». جرّب كلمات أقل أو امسح البحث.`)
};

/**
* | output |
* | --- |
* | "Nothing matches \"{query}\". Try fewer words or clear the search." |
*
* @param {Pathways_Nomatchesblurb2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const pathways_nomatchesblurb2 = /** @type {((inputs: Pathways_Nomatchesblurb2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Pathways_Nomatchesblurb2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_pathways_nomatchesblurb2(inputs)
	if (locale === "es") return es_pathways_nomatchesblurb2(inputs)
	if (locale === "fr") return fr_pathways_nomatchesblurb2(inputs)
	return ar_pathways_nomatchesblurb2(inputs)
});
export { pathways_nomatchesblurb2 as "pathways.noMatchesBlurb" }