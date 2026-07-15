/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Setup_Errors_Passmismatch1Inputs */

const en_recovery_setup_errors_passmismatch1 = /** @type {(inputs: Recovery_Setup_Errors_Passmismatch1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Passwords don't match.`)
};

const es_recovery_setup_errors_passmismatch1 = /** @type {(inputs: Recovery_Setup_Errors_Passmismatch1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Las contraseñas no coinciden.`)
};

const fr_recovery_setup_errors_passmismatch1 = /** @type {(inputs: Recovery_Setup_Errors_Passmismatch1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Les mots de passe ne correspondent pas.`)
};

const ar_recovery_setup_errors_passmismatch1 = /** @type {(inputs: Recovery_Setup_Errors_Passmismatch1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`كلمتا المرور غير متطابقتين.`)
};

/**
* | output |
* | --- |
* | "Passwords don't match." |
*
* @param {Recovery_Setup_Errors_Passmismatch1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_setup_errors_passmismatch1 = /** @type {((inputs?: Recovery_Setup_Errors_Passmismatch1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setup_Errors_Passmismatch1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setup_errors_passmismatch1(inputs)
	if (locale === "es") return es_recovery_setup_errors_passmismatch1(inputs)
	if (locale === "fr") return fr_recovery_setup_errors_passmismatch1(inputs)
	return ar_recovery_setup_errors_passmismatch1(inputs)
});
export { recovery_setup_errors_passmismatch1 as "recovery.setup.errors.passMismatch" }