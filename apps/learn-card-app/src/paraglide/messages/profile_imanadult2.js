/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Imanadult2Inputs */

const en_profile_imanadult2 = /** @type {(inputs: Profile_Imanadult2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`I'm an Adult`)
};

const es_profile_imanadult2 = /** @type {(inputs: Profile_Imanadult2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`soy un adulto`)
};

const de_profile_imanadult2 = /** @type {(inputs: Profile_Imanadult2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ich bin ein Erwachsener`)
};

const ar_profile_imanadult2 = /** @type {(inputs: Profile_Imanadult2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أنا شخص بالغ`)
};

const fr_profile_imanadult2 = /** @type {(inputs: Profile_Imanadult2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`je suis un adulte`)
};

const ko_profile_imanadult2 = /** @type {(inputs: Profile_Imanadult2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`나는 성인이다`)
};

/**
* | output |
* | --- |
* | "I'm an Adult" |
*
* @param {Profile_Imanadult2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const profile_imanadult2 = /** @type {((inputs?: Profile_Imanadult2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Imanadult2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_imanadult2(inputs)
	if (locale === "es") return es_profile_imanadult2(inputs)
	if (locale === "de") return de_profile_imanadult2(inputs)
	if (locale === "ar") return ar_profile_imanadult2(inputs)
	if (locale === "fr") return fr_profile_imanadult2(inputs)
	return ko_profile_imanadult2(inputs)
});
export { profile_imanadult2 as "profile.imAnAdult" }