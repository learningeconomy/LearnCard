/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Method_Setemail1Inputs */

const en_recovery_method_setemail1 = /** @type {(inputs: Recovery_Method_Setemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Email Recovery Key`)
};

const es_recovery_method_setemail1 = /** @type {(inputs: Recovery_Method_Setemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Clave de recuperación por correo`)
};

const fr_recovery_method_setemail1 = /** @type {(inputs: Recovery_Method_Setemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Clé de récupération par e-mail`)
};

const ar_recovery_method_setemail1 = /** @type {(inputs: Recovery_Method_Setemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مفتاح الاستعادة عبر البريد`)
};

/**
* | output |
* | --- |
* | "Email Recovery Key" |
*
* @param {Recovery_Method_Setemail1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_method_setemail1 = /** @type {((inputs?: Recovery_Method_Setemail1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Method_Setemail1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_method_setemail1(inputs)
	if (locale === "es") return es_recovery_method_setemail1(inputs)
	if (locale === "fr") return fr_recovery_method_setemail1(inputs)
	return ar_recovery_method_setemail1(inputs)
});
export { recovery_method_setemail1 as "recovery.method.setEmail" }