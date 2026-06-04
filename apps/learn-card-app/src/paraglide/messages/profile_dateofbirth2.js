/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Dateofbirth2Inputs */

const en_profile_dateofbirth2 = /** @type {(inputs: Profile_Dateofbirth2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Date of Birth`)
};

const es_profile_dateofbirth2 = /** @type {(inputs: Profile_Dateofbirth2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fecha de nacimiento`)
};

const de_profile_dateofbirth2 = /** @type {(inputs: Profile_Dateofbirth2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Geburtsdatum`)
};

const ar_profile_dateofbirth2 = /** @type {(inputs: Profile_Dateofbirth2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تاريخ الميلاد`)
};

const fr_profile_dateofbirth2 = /** @type {(inputs: Profile_Dateofbirth2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Date de naissance`)
};

const ko_profile_dateofbirth2 = /** @type {(inputs: Profile_Dateofbirth2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`생일`)
};

/**
* | output |
* | --- |
* | "Date of Birth" |
*
* @param {Profile_Dateofbirth2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const profile_dateofbirth2 = /** @type {((inputs?: Profile_Dateofbirth2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Dateofbirth2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_dateofbirth2(inputs)
	if (locale === "es") return es_profile_dateofbirth2(inputs)
	if (locale === "de") return de_profile_dateofbirth2(inputs)
	if (locale === "ar") return ar_profile_dateofbirth2(inputs)
	if (locale === "fr") return fr_profile_dateofbirth2(inputs)
	return ko_profile_dateofbirth2(inputs)
});
export { profile_dateofbirth2 as "profile.dateOfBirth" }