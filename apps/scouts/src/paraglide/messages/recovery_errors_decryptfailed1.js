/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Errors_Decryptfailed1Inputs */

const en_recovery_errors_decryptfailed1 = /** @type {(inputs: Recovery_Errors_Decryptfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Incorrect password or corrupted data. Please try again.`)
};

const es_recovery_errors_decryptfailed1 = /** @type {(inputs: Recovery_Errors_Decryptfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contraseña incorrecta o datos corruptos. Por favor inténtalo de nuevo.`)
};

const fr_recovery_errors_decryptfailed1 = /** @type {(inputs: Recovery_Errors_Decryptfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mot de passe incorrect ou données corrompues. Veuillez réessayer.`)
};

const ar_recovery_errors_decryptfailed1 = /** @type {(inputs: Recovery_Errors_Decryptfailed1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`كلمة مرور غير صحيحة أو بيانات تالفة. يرجى المحاولة مرة أخرى.`)
};

/**
* | output |
* | --- |
* | "Incorrect password or corrupted data. Please try again." |
*
* @param {Recovery_Errors_Decryptfailed1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_errors_decryptfailed1 = /** @type {((inputs?: Recovery_Errors_Decryptfailed1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Errors_Decryptfailed1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_errors_decryptfailed1(inputs)
	if (locale === "es") return es_recovery_errors_decryptfailed1(inputs)
	if (locale === "fr") return fr_recovery_errors_decryptfailed1(inputs)
	return ar_recovery_errors_decryptfailed1(inputs)
});
export { recovery_errors_decryptfailed1 as "recovery.errors.decryptFailed" }