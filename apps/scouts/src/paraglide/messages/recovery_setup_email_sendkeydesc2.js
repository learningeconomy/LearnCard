/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Setup_Email_Sendkeydesc2Inputs */

const en_recovery_setup_email_sendkeydesc2 = /** @type {(inputs: Recovery_Setup_Email_Sendkeydesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`We'll send a recovery key to this email. If you ever lose access, just check your inbox and paste the key to recover.`)
};

const es_recovery_setup_email_sendkeydesc2 = /** @type {(inputs: Recovery_Setup_Email_Sendkeydesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enviaremos una clave de recuperación a este correo. Si pierdes acceso, revisa tu bandeja y pega la clave.`)
};

const fr_recovery_setup_email_sendkeydesc2 = /** @type {(inputs: Recovery_Setup_Email_Sendkeydesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nous enverrons une clé de récupération à cet e-mail. Si vous perdez l'accès, vérifiez votre boîte de réception et collez la clé pour récupérer.`)
};

const ar_recovery_setup_email_sendkeydesc2 = /** @type {(inputs: Recovery_Setup_Email_Sendkeydesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`We'll send a recovery key to this email. If you ever lose access, just check your inbox and paste the key to recover.`)
};

/**
* | output |
* | --- |
* | "We'll send a recovery key to this email. If you ever lose access, just check your inbox and paste the key to recover." |
*
* @param {Recovery_Setup_Email_Sendkeydesc2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_setup_email_sendkeydesc2 = /** @type {((inputs?: Recovery_Setup_Email_Sendkeydesc2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setup_Email_Sendkeydesc2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setup_email_sendkeydesc2(inputs)
	if (locale === "es") return es_recovery_setup_email_sendkeydesc2(inputs)
	if (locale === "fr") return fr_recovery_setup_email_sendkeydesc2(inputs)
	return ar_recovery_setup_email_sendkeydesc2(inputs)
});
export { recovery_setup_email_sendkeydesc2 as "recovery.setup.email.sendKeyDesc" }