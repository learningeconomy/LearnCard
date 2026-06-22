/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Verify_Pleasewait1Inputs */

const en_profile_verify_pleasewait1 = /** @type {(inputs: Profile_Verify_Pleasewait1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Just a moment while we complete your verification.`)
};

const es_profile_verify_pleasewait1 = /** @type {(inputs: Profile_Verify_Pleasewait1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Un momento mientras completamos su verificación.`)
};

const fr_profile_verify_pleasewait1 = /** @type {(inputs: Profile_Verify_Pleasewait1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Juste un instant pendant que nous terminons votre vérification.`)
};

const ar_profile_verify_pleasewait1 = /** @type {(inputs: Profile_Verify_Pleasewait1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لن يستغرق سوى دقيقة واحدة حتى نكمل عملية التحقق.`)
};

/**
* | output |
* | --- |
* | "Just a moment while we complete your verification." |
*
* @param {Profile_Verify_Pleasewait1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const profile_verify_pleasewait1 = /** @type {((inputs?: Profile_Verify_Pleasewait1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Verify_Pleasewait1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_verify_pleasewait1(inputs)
	if (locale === "es") return es_profile_verify_pleasewait1(inputs)
	if (locale === "fr") return fr_profile_verify_pleasewait1(inputs)
	return ar_profile_verify_pleasewait1(inputs)
});
export { profile_verify_pleasewait1 as "profile.verify.pleaseWait" }