/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Createprofile_Rules_Format1Inputs */

const en_createprofile_rules_format1 = /** @type {(inputs: Createprofile_Rules_Format1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Letters, numbers, and dashes (-) only.`)
};

const es_createprofile_rules_format1 = /** @type {(inputs: Createprofile_Rules_Format1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Solo letras, números y guiones (-).`)
};

const fr_createprofile_rules_format1 = /** @type {(inputs: Createprofile_Rules_Format1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lettres, chiffres et tirets (-) uniquement.`)
};

const ar_createprofile_rules_format1 = /** @type {(inputs: Createprofile_Rules_Format1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أحرف وأرقام وشرطات (-) فقط.`)
};

/**
* | output |
* | --- |
* | "Letters, numbers, and dashes (-) only." |
*
* @param {Createprofile_Rules_Format1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const createprofile_rules_format1 = /** @type {((inputs?: Createprofile_Rules_Format1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Createprofile_Rules_Format1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_createprofile_rules_format1(inputs)
	if (locale === "es") return es_createprofile_rules_format1(inputs)
	if (locale === "fr") return fr_createprofile_rules_format1(inputs)
	return ar_createprofile_rules_format1(inputs)
});
export { createprofile_rules_format1 as "createProfile.rules.format" }