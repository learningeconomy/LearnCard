/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Setup_Errors_Passlength1Inputs */

const en_recovery_setup_errors_passlength1 = /** @type {(inputs: Recovery_Setup_Errors_Passlength1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Password must be at least 8 characters.`)
};

const es_recovery_setup_errors_passlength1 = /** @type {(inputs: Recovery_Setup_Errors_Passlength1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`La contraseña debe tener al menos 8 caracteres.`)
};

const fr_recovery_setup_errors_passlength1 = /** @type {(inputs: Recovery_Setup_Errors_Passlength1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Le mot de passe doit comporter au moins 8 caractères.`)
};

const ar_recovery_setup_errors_passlength1 = /** @type {(inputs: Recovery_Setup_Errors_Passlength1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Password must be at least 8 characters.`)
};

/**
* | output |
* | --- |
* | "Password must be at least 8 characters." |
*
* @param {Recovery_Setup_Errors_Passlength1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_setup_errors_passlength1 = /** @type {((inputs?: Recovery_Setup_Errors_Passlength1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setup_Errors_Passlength1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setup_errors_passlength1(inputs)
	if (locale === "es") return es_recovery_setup_errors_passlength1(inputs)
	if (locale === "fr") return fr_recovery_setup_errors_passlength1(inputs)
	return ar_recovery_setup_errors_passlength1(inputs)
});
export { recovery_setup_errors_passlength1 as "recovery.setup.errors.passLength" }