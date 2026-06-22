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

const fr_profile_verify_faileddesc1 = /** @type {(inputs: Profile_Verify_Faileddesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nous n'avons pas pu vérifier votre adresse e-mail. Le jeton est peut-être invalide ou expiré. Veuillez réessayer ou demander un nouvel e-mail de vérification.`)
};

const ar_profile_verify_faileddesc1 = /** @type {(inputs: Profile_Verify_Faileddesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم نتمكن من التحقق من بريدك الإلكتروني. قد يكون الرمز غير صالح أو منتهية الصلاحية. يرجى المحاولة مرة أخرى أو طلب بريد إلكتروني جديد للتحقق.`)
};

/**
* | output |
* | --- |
* | "We couldn't verify your email. The token may be invalid or expired. Please try again or request a new verification email." |
*
* @param {Profile_Verify_Faileddesc1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const profile_verify_faileddesc1 = /** @type {((inputs?: Profile_Verify_Faileddesc1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Verify_Faileddesc1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_verify_faileddesc1(inputs)
	if (locale === "es") return es_profile_verify_faileddesc1(inputs)
	if (locale === "fr") return fr_profile_verify_faileddesc1(inputs)
	return ar_profile_verify_faileddesc1(inputs)
});
export { profile_verify_faileddesc1 as "profile.verify.failedDesc" }