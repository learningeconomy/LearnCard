/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Setup_Email_Sendkeybtn2Inputs */

const en_recovery_setup_email_sendkeybtn2 = /** @type {(inputs: Recovery_Setup_Email_Sendkeybtn2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Send Recovery Key`)
};

const es_recovery_setup_email_sendkeybtn2 = /** @type {(inputs: Recovery_Setup_Email_Sendkeybtn2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enviar Clave de Recuperación`)
};

const fr_recovery_setup_email_sendkeybtn2 = /** @type {(inputs: Recovery_Setup_Email_Sendkeybtn2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envoyer la clé de récupération`)
};

const ar_recovery_setup_email_sendkeybtn2 = /** @type {(inputs: Recovery_Setup_Email_Sendkeybtn2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إرسال مفتاح الاسترداد`)
};

/**
* | output |
* | --- |
* | "Send Recovery Key" |
*
* @param {Recovery_Setup_Email_Sendkeybtn2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_setup_email_sendkeybtn2 = /** @type {((inputs?: Recovery_Setup_Email_Sendkeybtn2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setup_Email_Sendkeybtn2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setup_email_sendkeybtn2(inputs)
	if (locale === "es") return es_recovery_setup_email_sendkeybtn2(inputs)
	if (locale === "fr") return fr_recovery_setup_email_sendkeybtn2(inputs)
	return ar_recovery_setup_email_sendkeybtn2(inputs)
});
export { recovery_setup_email_sendkeybtn2 as "recovery.setup.email.sendKeyBtn" }