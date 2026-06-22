/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Createprofile_Validation_Nameformat2Inputs */

const en_createprofile_validation_nameformat2 = /** @type {(inputs: Createprofile_Validation_Nameformat2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Alphanumeric characters only.`)
};

const es_createprofile_validation_nameformat2 = /** @type {(inputs: Createprofile_Validation_Nameformat2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Solo caracteres alfanuméricos.`)
};

const fr_createprofile_validation_nameformat2 = /** @type {(inputs: Createprofile_Validation_Nameformat2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Caractères alphanumériques uniquement.`)
};

const ar_createprofile_validation_nameformat2 = /** @type {(inputs: Createprofile_Validation_Nameformat2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أحرف وأرقام فقط.`)
};

/**
* | output |
* | --- |
* | "Alphanumeric characters only." |
*
* @param {Createprofile_Validation_Nameformat2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const createprofile_validation_nameformat2 = /** @type {((inputs?: Createprofile_Validation_Nameformat2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Createprofile_Validation_Nameformat2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_createprofile_validation_nameformat2(inputs)
	if (locale === "es") return es_createprofile_validation_nameformat2(inputs)
	if (locale === "fr") return fr_createprofile_validation_nameformat2(inputs)
	return ar_createprofile_validation_nameformat2(inputs)
});
export { createprofile_validation_nameformat2 as "createProfile.validation.nameFormat" }