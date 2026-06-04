/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Verify_SuccessInputs */

const en_profile_verify_success = /** @type {(inputs: Profile_Verify_SuccessInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your email has successfully been verified.`)
};

const es_profile_verify_success = /** @type {(inputs: Profile_Verify_SuccessInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Su correo electrónico ha sido verificado exitosamente.`)
};

const de_profile_verify_success = /** @type {(inputs: Profile_Verify_SuccessInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ihre E-Mail-Adresse wurde erfolgreich bestätigt.`)
};

const ar_profile_verify_success = /** @type {(inputs: Profile_Verify_SuccessInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لقد تم التحقق من بريدك الإلكتروني بنجاح.`)
};

const fr_profile_verify_success = /** @type {(inputs: Profile_Verify_SuccessInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Votre email a été vérifié avec succès.`)
};

const ko_profile_verify_success = /** @type {(inputs: Profile_Verify_SuccessInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`귀하의 이메일이 성공적으로 확인되었습니다.`)
};

/**
* | output |
* | --- |
* | "Your email has successfully been verified." |
*
* @param {Profile_Verify_SuccessInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const profile_verify_success = /** @type {((inputs?: Profile_Verify_SuccessInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Verify_SuccessInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_verify_success(inputs)
	if (locale === "es") return es_profile_verify_success(inputs)
	if (locale === "de") return de_profile_verify_success(inputs)
	if (locale === "ar") return ar_profile_verify_success(inputs)
	if (locale === "fr") return fr_profile_verify_success(inputs)
	return ko_profile_verify_success(inputs)
});
export { profile_verify_success as "profile.verify.success" }