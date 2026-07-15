/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Setup_Errors_Invalidemail1Inputs */

const en_recovery_setup_errors_invalidemail1 = /** @type {(inputs: Recovery_Setup_Errors_Invalidemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Please enter a valid email address.`)
};

const es_recovery_setup_errors_invalidemail1 = /** @type {(inputs: Recovery_Setup_Errors_Invalidemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Por favor ingresa una dirección de correo válida.`)
};

const fr_recovery_setup_errors_invalidemail1 = /** @type {(inputs: Recovery_Setup_Errors_Invalidemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Veuillez saisir une adresse e-mail valide.`)
};

const ar_recovery_setup_errors_invalidemail1 = /** @type {(inputs: Recovery_Setup_Errors_Invalidemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Please enter a valid email address.`)
};

/**
* | output |
* | --- |
* | "Please enter a valid email address." |
*
* @param {Recovery_Setup_Errors_Invalidemail1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_setup_errors_invalidemail1 = /** @type {((inputs?: Recovery_Setup_Errors_Invalidemail1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setup_Errors_Invalidemail1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setup_errors_invalidemail1(inputs)
	if (locale === "es") return es_recovery_setup_errors_invalidemail1(inputs)
	if (locale === "fr") return fr_recovery_setup_errors_invalidemail1(inputs)
	return ar_recovery_setup_errors_invalidemail1(inputs)
});
export { recovery_setup_errors_invalidemail1 as "recovery.setup.errors.invalidEmail" }