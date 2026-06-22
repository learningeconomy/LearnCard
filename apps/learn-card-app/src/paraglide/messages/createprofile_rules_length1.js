/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Createprofile_Rules_Length1Inputs */

const en_createprofile_rules_length1 = /** @type {(inputs: Createprofile_Rules_Length1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Must be between 3 to 25 characters.`)
};

const es_createprofile_rules_length1 = /** @type {(inputs: Createprofile_Rules_Length1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Debe tener entre 3 y 25 caracteres.`)
};

const fr_createprofile_rules_length1 = /** @type {(inputs: Createprofile_Rules_Length1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Doit comporter entre 3 et 25 caractères.`)
};

const ar_createprofile_rules_length1 = /** @type {(inputs: Createprofile_Rules_Length1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يجب أن يتراوح بين 3 و25 حرفًا.`)
};

/**
* | output |
* | --- |
* | "Must be between 3 to 25 characters." |
*
* @param {Createprofile_Rules_Length1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const createprofile_rules_length1 = /** @type {((inputs?: Createprofile_Rules_Length1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Createprofile_Rules_Length1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_createprofile_rules_length1(inputs)
	if (locale === "es") return es_createprofile_rules_length1(inputs)
	if (locale === "fr") return fr_createprofile_rules_length1(inputs)
	return ar_createprofile_rules_length1(inputs)
});
export { createprofile_rules_length1 as "createProfile.rules.length" }