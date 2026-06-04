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

const de_profile_age = /** @type {(inputs: Profile_AgeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Alter:`)
};

const ar_profile_age = /** @type {(inputs: Profile_AgeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عمر:`)
};

const fr_profile_age = /** @type {(inputs: Profile_AgeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Âge:`)
};

const ko_profile_age = /** @type {(inputs: Profile_AgeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`나이:`)
};

/**
* | output |
* | --- |
* | "Age:" |
*
* @param {Profile_AgeInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const profile_age = /** @type {((inputs?: Profile_AgeInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_AgeInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_age(inputs)
	if (locale === "es") return es_profile_age(inputs)
	if (locale === "de") return de_profile_age(inputs)
	if (locale === "ar") return ar_profile_age(inputs)
	if (locale === "fr") return fr_profile_age(inputs)
	return ko_profile_age(inputs)
});
export { profile_age as "profile.age" }