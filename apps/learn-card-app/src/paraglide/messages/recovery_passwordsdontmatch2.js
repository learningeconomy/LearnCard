/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Passwordsdontmatch2Inputs */

const en_recovery_passwordsdontmatch2 = /** @type {(inputs: Recovery_Passwordsdontmatch2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Passwords don't match.`)
};

const es_recovery_passwordsdontmatch2 = /** @type {(inputs: Recovery_Passwordsdontmatch2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Las contraseñas no coinciden.`)
};

const fr_recovery_passwordsdontmatch2 = /** @type {(inputs: Recovery_Passwordsdontmatch2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Les mots de passe ne correspondent pas.`)
};

const ar_recovery_passwordsdontmatch2 = /** @type {(inputs: Recovery_Passwordsdontmatch2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`كلمات المرور غير متطابقة.`)
};

/**
* | output |
* | --- |
* | "Passwords don't match." |
*
* @param {Recovery_Passwordsdontmatch2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_passwordsdontmatch2 = /** @type {((inputs?: Recovery_Passwordsdontmatch2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Passwordsdontmatch2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_passwordsdontmatch2(inputs)
	if (locale === "es") return es_recovery_passwordsdontmatch2(inputs)
	if (locale === "fr") return fr_recovery_passwordsdontmatch2(inputs)
	return ar_recovery_passwordsdontmatch2(inputs)
});
export { recovery_passwordsdontmatch2 as "recovery.passwordsDontMatch" }