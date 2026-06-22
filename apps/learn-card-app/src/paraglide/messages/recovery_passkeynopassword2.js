/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Passkeynopassword2Inputs */

const en_recovery_passkeynopassword2 = /** @type {(inputs: Recovery_Passkeynopassword2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No password to remember`)
};

const es_recovery_passkeynopassword2 = /** @type {(inputs: Recovery_Passkeynopassword2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sin contraseña que recordar`)
};

const fr_recovery_passkeynopassword2 = /** @type {(inputs: Recovery_Passkeynopassword2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun mot de passe à retenir`)
};

const ar_recovery_passkeynopassword2 = /** @type {(inputs: Recovery_Passkeynopassword2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد كلمة مرور للحفظ`)
};

/**
* | output |
* | --- |
* | "No password to remember" |
*
* @param {Recovery_Passkeynopassword2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_passkeynopassword2 = /** @type {((inputs?: Recovery_Passkeynopassword2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Passkeynopassword2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_passkeynopassword2(inputs)
	if (locale === "es") return es_recovery_passkeynopassword2(inputs)
	if (locale === "fr") return fr_recovery_passkeynopassword2(inputs)
	return ar_recovery_passkeynopassword2(inputs)
});
export { recovery_passkeynopassword2 as "recovery.passkeyNoPassword" }