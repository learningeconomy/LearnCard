/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_AgeInputs */

const en_profile_age = /** @type {(inputs: Profile_AgeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Age:`)
};

const es_profile_age = /** @type {(inputs: Profile_AgeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Edad:`)
};

const fr_profile_age = /** @type {(inputs: Profile_AgeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Âge:`)
};

const ar_profile_age = /** @type {(inputs: Profile_AgeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عمر:`)
};

/**
* | output |
* | --- |
* | "Age:" |
*
* @param {Profile_AgeInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const profile_age = /** @type {((inputs?: Profile_AgeInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_AgeInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_age(inputs)
	if (locale === "es") return es_profile_age(inputs)
	if (locale === "fr") return fr_profile_age(inputs)
	return ar_profile_age(inputs)
});
export { profile_age as "profile.age" }