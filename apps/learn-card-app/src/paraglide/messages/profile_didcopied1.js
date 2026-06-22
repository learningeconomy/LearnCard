/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Didcopied1Inputs */

const en_profile_didcopied1 = /** @type {(inputs: Profile_Didcopied1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`DID copied to clipboard`)
};

const es_profile_didcopied1 = /** @type {(inputs: Profile_Didcopied1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`DID copiado al portapapeles`)
};

const fr_profile_didcopied1 = /** @type {(inputs: Profile_Didcopied1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`DID copié dans le presse-papiers`)
};

const ar_profile_didcopied1 = /** @type {(inputs: Profile_Didcopied1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم نسخ DID إلى الحافظة`)
};

/**
* | output |
* | --- |
* | "DID copied to clipboard" |
*
* @param {Profile_Didcopied1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const profile_didcopied1 = /** @type {((inputs?: Profile_Didcopied1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Didcopied1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_didcopied1(inputs)
	if (locale === "es") return es_profile_didcopied1(inputs)
	if (locale === "fr") return fr_profile_didcopied1(inputs)
	return ar_profile_didcopied1(inputs)
});
export { profile_didcopied1 as "profile.didCopied" }