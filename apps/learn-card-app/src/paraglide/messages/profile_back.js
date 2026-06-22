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

const fr_profile_back = /** @type {(inputs: Profile_BackInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Dos`)
};

const ar_profile_back = /** @type {(inputs: Profile_BackInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`خلف`)
};

/**
* | output |
* | --- |
* | "Back" |
*
* @param {Profile_BackInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const profile_back = /** @type {((inputs?: Profile_BackInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_BackInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_back(inputs)
	if (locale === "es") return es_profile_back(inputs)
	if (locale === "fr") return fr_profile_back(inputs)
	return ar_profile_back(inputs)
});
export { profile_back as "profile.back" }