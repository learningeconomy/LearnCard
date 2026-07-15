/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Setup_Errors_Incorrectcode1Inputs */

const en_recovery_setup_errors_incorrectcode1 = /** @type {(inputs: Recovery_Setup_Errors_Incorrectcode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Incorrect code. Please try again.`)
};

const es_recovery_setup_errors_incorrectcode1 = /** @type {(inputs: Recovery_Setup_Errors_Incorrectcode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Código incorrecto. Por favor inténtalo de nuevo.`)
};

const fr_recovery_setup_errors_incorrectcode1 = /** @type {(inputs: Recovery_Setup_Errors_Incorrectcode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Code incorrect. Veuillez réessayer.`)
};

const ar_recovery_setup_errors_incorrectcode1 = /** @type {(inputs: Recovery_Setup_Errors_Incorrectcode1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رمز غير صحيح. يرجى المحاولة مرة أخرى.`)
};

/**
* | output |
* | --- |
* | "Incorrect code. Please try again." |
*
* @param {Recovery_Setup_Errors_Incorrectcode1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_setup_errors_incorrectcode1 = /** @type {((inputs?: Recovery_Setup_Errors_Incorrectcode1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setup_Errors_Incorrectcode1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setup_errors_incorrectcode1(inputs)
	if (locale === "es") return es_recovery_setup_errors_incorrectcode1(inputs)
	if (locale === "fr") return fr_recovery_setup_errors_incorrectcode1(inputs)
	return ar_recovery_setup_errors_incorrectcode1(inputs)
});
export { recovery_setup_errors_incorrectcode1 as "recovery.setup.errors.incorrectCode" }