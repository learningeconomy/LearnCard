/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ brand: NonNullable<unknown>, marca: NonNullable<unknown>, "العلامة التجارية": NonNullable<unknown> }} Profile_Didlabel1Inputs */

const en_profile_didlabel1 = /** @type {(inputs: Profile_Didlabel1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.brand} Number (DID)`)
};

const es_profile_didlabel1 = /** @type {(inputs: Profile_Didlabel1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.marca} Número (DID)`)
};

const fr_profile_didlabel1 = /** @type {(inputs: Profile_Didlabel1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.brand} Numéro (DID)`)
};

const ar_profile_didlabel1 = /** @type {(inputs: Profile_Didlabel1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.["العلامة التجارية"]} رقم (DID)`)
};

/**
* | output |
* | --- |
* | "{brand} Number (DID)" |
*
* @param {Profile_Didlabel1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const profile_didlabel1 = /** @type {((inputs: Profile_Didlabel1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Didlabel1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_didlabel1(inputs)
	if (locale === "es") return es_profile_didlabel1(inputs)
	if (locale === "fr") return fr_profile_didlabel1(inputs)
	return ar_profile_didlabel1(inputs)
});
export { profile_didlabel1 as "profile.didLabel" }