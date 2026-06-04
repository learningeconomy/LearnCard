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

const de_recovery_method_setemail1 = /** @type {(inputs: Recovery_Method_Setemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Wiederherstellungsschlüssel per E-Mail`)
};

const ar_recovery_method_setemail1 = /** @type {(inputs: Recovery_Method_Setemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مفتاح الاستعادة عبر البريد`)
};

const fr_recovery_method_setemail1 = /** @type {(inputs: Recovery_Method_Setemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Clé de récupération par e-mail`)
};

const ko_recovery_method_setemail1 = /** @type {(inputs: Recovery_Method_Setemail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이메일 복구 키`)
};

/**
* | output |
* | --- |
* | "Email Recovery Key" |
*
* @param {Recovery_Method_Setemail1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const recovery_method_setemail1 = /** @type {((inputs?: Recovery_Method_Setemail1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Method_Setemail1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_method_setemail1(inputs)
	if (locale === "es") return es_recovery_method_setemail1(inputs)
	if (locale === "de") return de_recovery_method_setemail1(inputs)
	if (locale === "ar") return ar_recovery_method_setemail1(inputs)
	if (locale === "fr") return fr_recovery_method_setemail1(inputs)
	return ko_recovery_method_setemail1(inputs)
});
export { recovery_method_setemail1 as "recovery.method.setEmail" }