/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Export_Emailplaceholder1Inputs */

const en_profile_export_emailplaceholder1 = /** @type {(inputs: Profile_Export_Emailplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Email...`)
};

const es_profile_export_emailplaceholder1 = /** @type {(inputs: Profile_Export_Emailplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Correo electrónico...`)
};

const de_profile_export_emailplaceholder1 = /** @type {(inputs: Profile_Export_Emailplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`E-Mail...`)
};

const ar_profile_export_emailplaceholder1 = /** @type {(inputs: Profile_Export_Emailplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بريد إلكتروني...`)
};

const fr_profile_export_emailplaceholder1 = /** @type {(inputs: Profile_Export_Emailplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`E-mail...`)
};

const ko_profile_export_emailplaceholder1 = /** @type {(inputs: Profile_Export_Emailplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이메일...`)
};

/**
* | output |
* | --- |
* | "Email..." |
*
* @param {Profile_Export_Emailplaceholder1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const profile_export_emailplaceholder1 = /** @type {((inputs?: Profile_Export_Emailplaceholder1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Export_Emailplaceholder1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_export_emailplaceholder1(inputs)
	if (locale === "es") return es_profile_export_emailplaceholder1(inputs)
	if (locale === "de") return de_profile_export_emailplaceholder1(inputs)
	if (locale === "ar") return ar_profile_export_emailplaceholder1(inputs)
	if (locale === "fr") return fr_profile_export_emailplaceholder1(inputs)
	return ko_profile_export_emailplaceholder1(inputs)
});
export { profile_export_emailplaceholder1 as "profile.export.emailPlaceholder" }