/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ brand: NonNullable<unknown>, marca: NonNullable<unknown>, "العلامة التجارية": NonNullable<unknown>, "브랜드": NonNullable<unknown> }} Profile_Didlabel1Inputs */

const en_profile_didlabel1 = /** @type {(inputs: Profile_Didlabel1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.brand} Number (DID)`)
};

const es_profile_didlabel1 = /** @type {(inputs: Profile_Didlabel1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.marca} Número (DID)`)
};

const de_profile_didlabel1 = /** @type {(inputs: Profile_Didlabel1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.brand} Nummer (DID)`)
};

const ar_profile_didlabel1 = /** @type {(inputs: Profile_Didlabel1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.["العلامة التجارية"]} رقم (DID)`)
};

const fr_profile_didlabel1 = /** @type {(inputs: Profile_Didlabel1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.brand} Numéro (DID)`)
};

const ko_profile_didlabel1 = /** @type {(inputs: Profile_Didlabel1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.["브랜드"]} 번호(DID)`)
};

/**
* | output |
* | --- |
* | "{brand} Number (DID)" |
*
* @param {Profile_Didlabel1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const profile_didlabel1 = /** @type {((inputs: Profile_Didlabel1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Didlabel1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_didlabel1(inputs)
	if (locale === "es") return es_profile_didlabel1(inputs)
	if (locale === "de") return de_profile_didlabel1(inputs)
	if (locale === "ar") return ar_profile_didlabel1(inputs)
	if (locale === "fr") return fr_profile_didlabel1(inputs)
	return ko_profile_didlabel1(inputs)
});
export { profile_didlabel1 as "profile.didLabel" }