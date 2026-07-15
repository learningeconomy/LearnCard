/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Method_Emaillabel1Inputs */

const en_recovery_method_emaillabel1 = /** @type {(inputs: Recovery_Method_Emaillabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Email Recovery Key`)
};

const es_recovery_method_emaillabel1 = /** @type {(inputs: Recovery_Method_Emaillabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Clave de Recuperación por Correo`)
};

const fr_recovery_method_emaillabel1 = /** @type {(inputs: Recovery_Method_Emaillabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Clé de récupération par e-mail`)
};

const ar_recovery_method_emaillabel1 = /** @type {(inputs: Recovery_Method_Emaillabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مفتاح استرداد البريد الإلكتروني`)
};

/**
* | output |
* | --- |
* | "Email Recovery Key" |
*
* @param {Recovery_Method_Emaillabel1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_method_emaillabel1 = /** @type {((inputs?: Recovery_Method_Emaillabel1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Method_Emaillabel1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_method_emaillabel1(inputs)
	if (locale === "es") return es_recovery_method_emaillabel1(inputs)
	if (locale === "fr") return fr_recovery_method_emaillabel1(inputs)
	return ar_recovery_method_emaillabel1(inputs)
});
export { recovery_method_emaillabel1 as "recovery.method.emailLabel" }