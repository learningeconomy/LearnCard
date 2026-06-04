/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Export_Phoneplaceholder1Inputs */

const en_profile_export_phoneplaceholder1 = /** @type {(inputs: Profile_Export_Phoneplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Phone Number...`)
};

const es_profile_export_phoneplaceholder1 = /** @type {(inputs: Profile_Export_Phoneplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Número de teléfono...`)
};

const de_profile_export_phoneplaceholder1 = /** @type {(inputs: Profile_Export_Phoneplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Telefonnummer...`)
};

const ar_profile_export_phoneplaceholder1 = /** @type {(inputs: Profile_Export_Phoneplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رقم التليفون...`)
};

const fr_profile_export_phoneplaceholder1 = /** @type {(inputs: Profile_Export_Phoneplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Numéro de téléphone...`)
};

const ko_profile_export_phoneplaceholder1 = /** @type {(inputs: Profile_Export_Phoneplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`전화 번호...`)
};

/**
* | output |
* | --- |
* | "Phone Number..." |
*
* @param {Profile_Export_Phoneplaceholder1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const profile_export_phoneplaceholder1 = /** @type {((inputs?: Profile_Export_Phoneplaceholder1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Export_Phoneplaceholder1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_export_phoneplaceholder1(inputs)
	if (locale === "es") return es_profile_export_phoneplaceholder1(inputs)
	if (locale === "de") return de_profile_export_phoneplaceholder1(inputs)
	if (locale === "ar") return ar_profile_export_phoneplaceholder1(inputs)
	if (locale === "fr") return fr_profile_export_phoneplaceholder1(inputs)
	return ko_profile_export_phoneplaceholder1(inputs)
});
export { profile_export_phoneplaceholder1 as "profile.export.phonePlaceholder" }