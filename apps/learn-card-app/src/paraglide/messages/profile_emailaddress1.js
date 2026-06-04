/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Emailaddress1Inputs */

const en_profile_emailaddress1 = /** @type {(inputs: Profile_Emailaddress1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Email Address`)
};

const es_profile_emailaddress1 = /** @type {(inputs: Profile_Emailaddress1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Dirección de correo electrónico`)
};

const de_profile_emailaddress1 = /** @type {(inputs: Profile_Emailaddress1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`E-Mail-Adresse`)
};

const ar_profile_emailaddress1 = /** @type {(inputs: Profile_Emailaddress1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عنوان البريد الإلكتروني`)
};

const fr_profile_emailaddress1 = /** @type {(inputs: Profile_Emailaddress1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Adresse email`)
};

const ko_profile_emailaddress1 = /** @type {(inputs: Profile_Emailaddress1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이메일 주소`)
};

/**
* | output |
* | --- |
* | "Email Address" |
*
* @param {Profile_Emailaddress1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const profile_emailaddress1 = /** @type {((inputs?: Profile_Emailaddress1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Emailaddress1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_emailaddress1(inputs)
	if (locale === "es") return es_profile_emailaddress1(inputs)
	if (locale === "de") return de_profile_emailaddress1(inputs)
	if (locale === "ar") return ar_profile_emailaddress1(inputs)
	if (locale === "fr") return fr_profile_emailaddress1(inputs)
	return ko_profile_emailaddress1(inputs)
});
export { profile_emailaddress1 as "profile.emailAddress" }