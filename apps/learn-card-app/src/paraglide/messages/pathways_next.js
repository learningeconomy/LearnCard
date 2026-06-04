/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Pathways_NextInputs */

const en_pathways_next = /** @type {(inputs: Pathways_NextInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Next`)
};

const es_pathways_next = /** @type {(inputs: Pathways_NextInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Siguiente`)
};

const de_pathways_next = /** @type {(inputs: Pathways_NextInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Weiter`)
};

const ar_pathways_next = /** @type {(inputs: Pathways_NextInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التالي`)
};

const fr_pathways_next = /** @type {(inputs: Pathways_NextInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Suivant`)
};

const ko_pathways_next = /** @type {(inputs: Pathways_NextInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`다음`)
};

/**
* | output |
* | --- |
* | "Next" |
*
* @param {Pathways_NextInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const pathways_next = /** @type {((inputs?: Pathways_NextInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Pathways_NextInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_pathways_next(inputs)
	if (locale === "es") return es_pathways_next(inputs)
	if (locale === "de") return de_pathways_next(inputs)
	if (locale === "ar") return ar_pathways_next(inputs)
	if (locale === "fr") return fr_pathways_next(inputs)
	return ko_pathways_next(inputs)
});
export { pathways_next as "pathways.next" }