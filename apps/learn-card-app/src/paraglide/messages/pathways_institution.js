/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Pathways_InstitutionInputs */

const en_pathways_institution = /** @type {(inputs: Pathways_InstitutionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Institution`)
};

const es_pathways_institution = /** @type {(inputs: Pathways_InstitutionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Institución`)
};

const de_pathways_institution = /** @type {(inputs: Pathways_InstitutionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Institution`)
};

const ar_pathways_institution = /** @type {(inputs: Pathways_InstitutionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المؤسسة`)
};

const fr_pathways_institution = /** @type {(inputs: Pathways_InstitutionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Établissement`)
};

const ko_pathways_institution = /** @type {(inputs: Pathways_InstitutionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`기관`)
};

/**
* | output |
* | --- |
* | "Institution" |
*
* @param {Pathways_InstitutionInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const pathways_institution = /** @type {((inputs?: Pathways_InstitutionInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Pathways_InstitutionInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_pathways_institution(inputs)
	if (locale === "es") return es_pathways_institution(inputs)
	if (locale === "de") return de_pathways_institution(inputs)
	if (locale === "ar") return ar_pathways_institution(inputs)
	if (locale === "fr") return fr_pathways_institution(inputs)
	return ko_pathways_institution(inputs)
});
export { pathways_institution as "pathways.institution" }