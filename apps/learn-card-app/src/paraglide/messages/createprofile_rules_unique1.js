/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Createprofile_Rules_Unique1Inputs */

const en_createprofile_rules_unique1 = /** @type {(inputs: Createprofile_Rules_Unique1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Must be unique.`)
};

const es_createprofile_rules_unique1 = /** @type {(inputs: Createprofile_Rules_Unique1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Debe ser único.`)
};

const fr_createprofile_rules_unique1 = /** @type {(inputs: Createprofile_Rules_Unique1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Doit être unique.`)
};

const ar_createprofile_rules_unique1 = /** @type {(inputs: Createprofile_Rules_Unique1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يجب أن يكون فريدًا.`)
};

/**
* | output |
* | --- |
* | "Must be unique." |
*
* @param {Createprofile_Rules_Unique1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const createprofile_rules_unique1 = /** @type {((inputs?: Createprofile_Rules_Unique1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Createprofile_Rules_Unique1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_createprofile_rules_unique1(inputs)
	if (locale === "es") return es_createprofile_rules_unique1(inputs)
	if (locale === "fr") return fr_createprofile_rules_unique1(inputs)
	return ar_createprofile_rules_unique1(inputs)
});
export { createprofile_rules_unique1 as "createProfile.rules.unique" }