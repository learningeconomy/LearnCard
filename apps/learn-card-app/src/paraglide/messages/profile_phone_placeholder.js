/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Phone_PlaceholderInputs */

const en_profile_phone_placeholder = /** @type {(inputs: Profile_Phone_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Phone`)
};

const es_profile_phone_placeholder = /** @type {(inputs: Profile_Phone_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Teléfono`)
};

const de_profile_phone_placeholder = /** @type {(inputs: Profile_Phone_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Telefon`)
};

const ar_profile_phone_placeholder = /** @type {(inputs: Profile_Phone_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هاتف`)
};

const fr_profile_phone_placeholder = /** @type {(inputs: Profile_Phone_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Téléphone`)
};

const ko_profile_phone_placeholder = /** @type {(inputs: Profile_Phone_PlaceholderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`핸드폰`)
};

/**
* | output |
* | --- |
* | "Phone" |
*
* @param {Profile_Phone_PlaceholderInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const profile_phone_placeholder = /** @type {((inputs?: Profile_Phone_PlaceholderInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Phone_PlaceholderInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_phone_placeholder(inputs)
	if (locale === "es") return es_profile_phone_placeholder(inputs)
	if (locale === "de") return de_profile_phone_placeholder(inputs)
	if (locale === "ar") return ar_profile_phone_placeholder(inputs)
	if (locale === "fr") return fr_profile_phone_placeholder(inputs)
	return ko_profile_phone_placeholder(inputs)
});
export { profile_phone_placeholder as "profile.phone.placeholder" }