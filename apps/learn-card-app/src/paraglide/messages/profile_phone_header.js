/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Phone_HeaderInputs */

const en_profile_phone_header = /** @type {(inputs: Profile_Phone_HeaderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Phone`)
};

const es_profile_phone_header = /** @type {(inputs: Profile_Phone_HeaderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Teléfono`)
};

const fr_profile_phone_header = /** @type {(inputs: Profile_Phone_HeaderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Téléphone`)
};

const ar_profile_phone_header = /** @type {(inputs: Profile_Phone_HeaderInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هاتف`)
};

/**
* | output |
* | --- |
* | "Phone" |
*
* @param {Profile_Phone_HeaderInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const profile_phone_header = /** @type {((inputs?: Profile_Phone_HeaderInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Phone_HeaderInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_phone_header(inputs)
	if (locale === "es") return es_profile_phone_header(inputs)
	if (locale === "fr") return fr_profile_phone_header(inputs)
	return ar_profile_phone_header(inputs)
});
export { profile_phone_header as "profile.phone.header" }