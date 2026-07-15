/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Setup_Email_Sendcodebtn2Inputs */

const en_recovery_setup_email_sendcodebtn2 = /** @type {(inputs: Recovery_Setup_Email_Sendcodebtn2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Send Verification Code`)
};

const es_recovery_setup_email_sendcodebtn2 = /** @type {(inputs: Recovery_Setup_Email_Sendcodebtn2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enviar Código de Verificación`)
};

const fr_recovery_setup_email_sendcodebtn2 = /** @type {(inputs: Recovery_Setup_Email_Sendcodebtn2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envoyer le code de vérification`)
};

const ar_recovery_setup_email_sendcodebtn2 = /** @type {(inputs: Recovery_Setup_Email_Sendcodebtn2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Send Verification Code`)
};

/**
* | output |
* | --- |
* | "Send Verification Code" |
*
* @param {Recovery_Setup_Email_Sendcodebtn2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_setup_email_sendcodebtn2 = /** @type {((inputs?: Recovery_Setup_Email_Sendcodebtn2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setup_Email_Sendcodebtn2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setup_email_sendcodebtn2(inputs)
	if (locale === "es") return es_recovery_setup_email_sendcodebtn2(inputs)
	if (locale === "fr") return fr_recovery_setup_email_sendcodebtn2(inputs)
	return ar_recovery_setup_email_sendcodebtn2(inputs)
});
export { recovery_setup_email_sendcodebtn2 as "recovery.setup.email.sendCodeBtn" }