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

const de_profile_verify_pleasewait1 = /** @type {(inputs: Profile_Verify_Pleasewait1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nur einen Moment, während wir Ihre Verifizierung abschließen.`)
};

const ar_profile_verify_pleasewait1 = /** @type {(inputs: Profile_Verify_Pleasewait1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لن يستغرق سوى دقيقة واحدة حتى نكمل عملية التحقق.`)
};

const fr_profile_verify_pleasewait1 = /** @type {(inputs: Profile_Verify_Pleasewait1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Juste un instant pendant que nous terminons votre vérification.`)
};

const ko_profile_verify_pleasewait1 = /** @type {(inputs: Profile_Verify_Pleasewait1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`확인을 완료하는 동안 잠시만 기다려 주세요.`)
};

/**
* | output |
* | --- |
* | "Just a moment while we complete your verification." |
*
* @param {Profile_Verify_Pleasewait1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const profile_verify_pleasewait1 = /** @type {((inputs?: Profile_Verify_Pleasewait1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Verify_Pleasewait1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_verify_pleasewait1(inputs)
	if (locale === "es") return es_profile_verify_pleasewait1(inputs)
	if (locale === "de") return de_profile_verify_pleasewait1(inputs)
	if (locale === "ar") return ar_profile_verify_pleasewait1(inputs)
	if (locale === "fr") return fr_profile_verify_pleasewait1(inputs)
	return ko_profile_verify_pleasewait1(inputs)
});
export { profile_verify_pleasewait1 as "profile.verify.pleaseWait" }