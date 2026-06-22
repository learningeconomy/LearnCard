/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Verify_VerifyingInputs */

const en_profile_verify_verifying = /** @type {(inputs: Profile_Verify_VerifyingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verifying your email...`)
};

const es_profile_verify_verifying = /** @type {(inputs: Profile_Verify_VerifyingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verificando tu correo electrónico...`)
};

const fr_profile_verify_verifying = /** @type {(inputs: Profile_Verify_VerifyingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vérification de votre e-mail...`)
};

const ar_profile_verify_verifying = /** @type {(inputs: Profile_Verify_VerifyingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ التحقق من بريدك الإلكتروني...`)
};

/**
* | output |
* | --- |
* | "Verifying your email..." |
*
* @param {Profile_Verify_VerifyingInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const profile_verify_verifying = /** @type {((inputs?: Profile_Verify_VerifyingInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Verify_VerifyingInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_verify_verifying(inputs)
	if (locale === "es") return es_profile_verify_verifying(inputs)
	if (locale === "fr") return fr_profile_verify_verifying(inputs)
	return ar_profile_verify_verifying(inputs)
});
export { profile_verify_verifying as "profile.verify.verifying" }