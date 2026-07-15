/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Setup_Email_Codelabel1Inputs */

const en_recovery_setup_email_codelabel1 = /** @type {(inputs: Recovery_Setup_Email_Codelabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verification Code`)
};

const es_recovery_setup_email_codelabel1 = /** @type {(inputs: Recovery_Setup_Email_Codelabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Código de Verificación`)
};

const fr_recovery_setup_email_codelabel1 = /** @type {(inputs: Recovery_Setup_Email_Codelabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Code de vérification`)
};

const ar_recovery_setup_email_codelabel1 = /** @type {(inputs: Recovery_Setup_Email_Codelabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رمز التحقق`)
};

/**
* | output |
* | --- |
* | "Verification Code" |
*
* @param {Recovery_Setup_Email_Codelabel1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_setup_email_codelabel1 = /** @type {((inputs?: Recovery_Setup_Email_Codelabel1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setup_Email_Codelabel1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setup_email_codelabel1(inputs)
	if (locale === "es") return es_recovery_setup_email_codelabel1(inputs)
	if (locale === "fr") return fr_recovery_setup_email_codelabel1(inputs)
	return ar_recovery_setup_email_codelabel1(inputs)
});
export { recovery_setup_email_codelabel1 as "recovery.setup.email.codeLabel" }