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

const fr_pathways_institution = /** @type {(inputs: Pathways_InstitutionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Établissement`)
};

const ar_pathways_institution = /** @type {(inputs: Pathways_InstitutionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المؤسسة`)
};

/**
* | output |
* | --- |
* | "Institution" |
*
* @param {Pathways_InstitutionInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const pathways_institution = /** @type {((inputs?: Pathways_InstitutionInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Pathways_InstitutionInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_pathways_institution(inputs)
	if (locale === "es") return es_pathways_institution(inputs)
	if (locale === "fr") return fr_pathways_institution(inputs)
	return ar_pathways_institution(inputs)
});
export { pathways_institution as "pathways.institution" }