/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Verify_Faileddesc1Inputs */

const en_profile_verify_faileddesc1 = /** @type {(inputs: Profile_Verify_Faileddesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`We couldn't verify your email. The token may be invalid or expired. Please try again or request a new verification email.`)
};

const es_profile_verify_faileddesc1 = /** @type {(inputs: Profile_Verify_Faileddesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No pudimos verificar su correo electrónico. El token puede no ser válido o haber caducado. Inténtelo de nuevo o solicite un nuevo correo electrónico de verificación.`)
};

const de_profile_verify_faileddesc1 = /** @type {(inputs: Profile_Verify_Faileddesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Wir konnten Ihre E-Mail-Adresse nicht bestätigen. Der Token ist möglicherweise ungültig oder abgelaufen. Bitte versuchen Sie es erneut oder fordern Sie eine neue Bestätigungs-E-Mail an.`)
};

const ar_profile_verify_faileddesc1 = /** @type {(inputs: Profile_Verify_Faileddesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم نتمكن من التحقق من بريدك الإلكتروني. قد يكون الرمز غير صالح أو منتهية الصلاحية. يرجى المحاولة مرة أخرى أو طلب بريد إلكتروني جديد للتحقق.`)
};

const fr_profile_verify_faileddesc1 = /** @type {(inputs: Profile_Verify_Faileddesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nous n'avons pas pu vérifier votre adresse e-mail. Le jeton est peut-être invalide ou expiré. Veuillez réessayer ou demander un nouvel e-mail de vérification.`)
};

const ko_profile_verify_faileddesc1 = /** @type {(inputs: Profile_Verify_Faileddesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이메일을 확인할 수 없습니다. 토큰이 유효하지 않거나 만료되었을 수 있습니다. 다시 시도하거나 새 확인 이메일을 요청하세요.`)
};

/**
* | output |
* | --- |
* | "We couldn't verify your email. The token may be invalid or expired. Please try again or request a new verification email." |
*
* @param {Profile_Verify_Faileddesc1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const profile_verify_faileddesc1 = /** @type {((inputs?: Profile_Verify_Faileddesc1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Verify_Faileddesc1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_verify_faileddesc1(inputs)
	if (locale === "es") return es_profile_verify_faileddesc1(inputs)
	if (locale === "de") return de_profile_verify_faileddesc1(inputs)
	if (locale === "ar") return ar_profile_verify_faileddesc1(inputs)
	if (locale === "fr") return fr_profile_verify_faileddesc1(inputs)
	return ko_profile_verify_faileddesc1(inputs)
});
export { profile_verify_faileddesc1 as "profile.verify.failedDesc" }