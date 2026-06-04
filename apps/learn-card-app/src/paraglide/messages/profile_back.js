/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_BackInputs */

const en_profile_back = /** @type {(inputs: Profile_BackInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Back`)
};

const es_profile_back = /** @type {(inputs: Profile_BackInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Atrás`)
};

const de_profile_back = /** @type {(inputs: Profile_BackInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Zurück`)
};

const ar_profile_back = /** @type {(inputs: Profile_BackInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`خلف`)
};

const fr_profile_back = /** @type {(inputs: Profile_BackInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Dos`)
};

const ko_profile_back = /** @type {(inputs: Profile_BackInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`뒤쪽에`)
};

/**
* | output |
* | --- |
* | "Back" |
*
* @param {Profile_BackInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const profile_back = /** @type {((inputs?: Profile_BackInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_BackInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_back(inputs)
	if (locale === "es") return es_profile_back(inputs)
	if (locale === "de") return de_profile_back(inputs)
	if (locale === "ar") return ar_profile_back(inputs)
	if (locale === "fr") return fr_profile_back(inputs)
	return ko_profile_back(inputs)
});
export { profile_back as "profile.back" }