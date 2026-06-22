/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Emailkeydescription2Inputs */

const en_recovery_emailkeydescription2 = /** @type {(inputs: Recovery_Emailkeydescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`We'll send a recovery key to this email. If you ever lose access, just check your inbox and paste the key to recover.`)
};

const es_recovery_emailkeydescription2 = /** @type {(inputs: Recovery_Emailkeydescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enviaremos una clave de recuperación a este correo. Si alguna vez pierdes acceso, solo revisa tu bandeja de entrada y pega la clave para recuperar.`)
};

const fr_recovery_emailkeydescription2 = /** @type {(inputs: Recovery_Emailkeydescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nous enverrons une clé de récupération à cet e-mail. Si vous perdez l'accès, vérifiez votre boîte de réception et collez la clé pour récupérer.`)
};

const ar_recovery_emailkeydescription2 = /** @type {(inputs: Recovery_Emailkeydescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سنرسل مفتاح استرداد إلى هذا البريد. إذا فقدت الوصول يومًا ما، فقط تحقق من بريدك الوارد والصق المفتاح للاسترداد.`)
};

/**
* | output |
* | --- |
* | "We'll send a recovery key to this email. If you ever lose access, just check your inbox and paste the key to recover." |
*
* @param {Recovery_Emailkeydescription2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_emailkeydescription2 = /** @type {((inputs?: Recovery_Emailkeydescription2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Emailkeydescription2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_emailkeydescription2(inputs)
	if (locale === "es") return es_recovery_emailkeydescription2(inputs)
	if (locale === "fr") return fr_recovery_emailkeydescription2(inputs)
	return ar_recovery_emailkeydescription2(inputs)
});
export { recovery_emailkeydescription2 as "recovery.emailKeyDescription" }