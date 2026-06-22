/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Phonenumber1Inputs */

const en_profile_phonenumber1 = /** @type {(inputs: Profile_Phonenumber1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Phone Number`)
};

const es_profile_phonenumber1 = /** @type {(inputs: Profile_Phonenumber1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Número de teléfono`)
};

const fr_profile_phonenumber1 = /** @type {(inputs: Profile_Phonenumber1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Numéro de téléphone`)
};

const ar_profile_phonenumber1 = /** @type {(inputs: Profile_Phonenumber1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رقم التليفون`)
};

/**
* | output |
* | --- |
* | "Phone Number" |
*
* @param {Profile_Phonenumber1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const profile_phonenumber1 = /** @type {((inputs?: Profile_Phonenumber1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Phonenumber1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_phonenumber1(inputs)
	if (locale === "es") return es_profile_phonenumber1(inputs)
	if (locale === "fr") return fr_profile_phonenumber1(inputs)
	return ar_profile_phonenumber1(inputs)
});
export { profile_phonenumber1 as "profile.phoneNumber" }