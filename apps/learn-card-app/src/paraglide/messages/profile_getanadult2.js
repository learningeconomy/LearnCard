/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Getanadult2Inputs */

const en_profile_getanadult2 = /** @type {(inputs: Profile_Getanadult2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Get an Adult`)
};

const es_profile_getanadult2 = /** @type {(inputs: Profile_Getanadult2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`conseguir un adulto`)
};

const fr_profile_getanadult2 = /** @type {(inputs: Profile_Getanadult2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Obtenez un adulte`)
};

const ar_profile_getanadult2 = /** @type {(inputs: Profile_Getanadult2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`احصل على شخص بالغ`)
};

/**
* | output |
* | --- |
* | "Get an Adult" |
*
* @param {Profile_Getanadult2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const profile_getanadult2 = /** @type {((inputs?: Profile_Getanadult2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Getanadult2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_getanadult2(inputs)
	if (locale === "es") return es_profile_getanadult2(inputs)
	if (locale === "fr") return fr_profile_getanadult2(inputs)
	return ar_profile_getanadult2(inputs)
});
export { profile_getanadult2 as "profile.getAnAdult" }