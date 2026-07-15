/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Setup_Errors_Codelength1Inputs */

const en_recovery_setup_errors_codelength1 = /** @type {(inputs: Recovery_Setup_Errors_Codelength1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Please enter the 6-digit code.`)
};

const es_recovery_setup_errors_codelength1 = /** @type {(inputs: Recovery_Setup_Errors_Codelength1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Por favor ingresa el código de 6 dígitos.`)
};

const fr_recovery_setup_errors_codelength1 = /** @type {(inputs: Recovery_Setup_Errors_Codelength1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Veuillez saisir le code à 6 chiffres.`)
};

const ar_recovery_setup_errors_codelength1 = /** @type {(inputs: Recovery_Setup_Errors_Codelength1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يرجى إدخال الرمز المكون من 6 أرقام.`)
};

/**
* | output |
* | --- |
* | "Please enter the 6-digit code." |
*
* @param {Recovery_Setup_Errors_Codelength1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_setup_errors_codelength1 = /** @type {((inputs?: Recovery_Setup_Errors_Codelength1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setup_Errors_Codelength1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setup_errors_codelength1(inputs)
	if (locale === "es") return es_recovery_setup_errors_codelength1(inputs)
	if (locale === "fr") return fr_recovery_setup_errors_codelength1(inputs)
	return ar_recovery_setup_errors_codelength1(inputs)
});
export { recovery_setup_errors_codelength1 as "recovery.setup.errors.codeLength" }