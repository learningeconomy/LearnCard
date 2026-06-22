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

const fr_profile_imanadult2 = /** @type {(inputs: Profile_Imanadult2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`je suis un adulte`)
};

const ar_profile_imanadult2 = /** @type {(inputs: Profile_Imanadult2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أنا شخص بالغ`)
};

/**
* | output |
* | --- |
* | "I'm an Adult" |
*
* @param {Profile_Imanadult2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const profile_imanadult2 = /** @type {((inputs?: Profile_Imanadult2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Imanadult2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_imanadult2(inputs)
	if (locale === "es") return es_profile_imanadult2(inputs)
	if (locale === "fr") return fr_profile_imanadult2(inputs)
	return ar_profile_imanadult2(inputs)
});
export { profile_imanadult2 as "profile.imAnAdult" }