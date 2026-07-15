/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Setup_Email_Verifycodebtn2Inputs */

const en_recovery_setup_email_verifycodebtn2 = /** @type {(inputs: Recovery_Setup_Email_Verifycodebtn2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verify Code`)
};

const es_recovery_setup_email_verifycodebtn2 = /** @type {(inputs: Recovery_Setup_Email_Verifycodebtn2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verificar Código`)
};

const fr_recovery_setup_email_verifycodebtn2 = /** @type {(inputs: Recovery_Setup_Email_Verifycodebtn2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vérifier le code`)
};

const ar_recovery_setup_email_verifycodebtn2 = /** @type {(inputs: Recovery_Setup_Email_Verifycodebtn2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verify Code`)
};

/**
* | output |
* | --- |
* | "Verify Code" |
*
* @param {Recovery_Setup_Email_Verifycodebtn2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_setup_email_verifycodebtn2 = /** @type {((inputs?: Recovery_Setup_Email_Verifycodebtn2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setup_Email_Verifycodebtn2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setup_email_verifycodebtn2(inputs)
	if (locale === "es") return es_recovery_setup_email_verifycodebtn2(inputs)
	if (locale === "fr") return fr_recovery_setup_email_verifycodebtn2(inputs)
	return ar_recovery_setup_email_verifycodebtn2(inputs)
});
export { recovery_setup_email_verifycodebtn2 as "recovery.setup.email.verifyCodeBtn" }