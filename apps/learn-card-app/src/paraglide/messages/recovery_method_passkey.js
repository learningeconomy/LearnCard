/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Method_PasskeyInputs */

const en_recovery_method_passkey = /** @type {(inputs: Recovery_Method_PasskeyInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Passkey`)
};

const es_recovery_method_passkey = /** @type {(inputs: Recovery_Method_PasskeyInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Clave de acceso`)
};

const de_recovery_method_passkey = /** @type {(inputs: Recovery_Method_PasskeyInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Passkey`)
};

const ar_recovery_method_passkey = /** @type {(inputs: Recovery_Method_PasskeyInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مفتاح المرور`)
};

const fr_recovery_method_passkey = /** @type {(inputs: Recovery_Method_PasskeyInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Clé d'accès`)
};

const ko_recovery_method_passkey = /** @type {(inputs: Recovery_Method_PasskeyInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`패스키`)
};

/**
* | output |
* | --- |
* | "Passkey" |
*
* @param {Recovery_Method_PasskeyInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const recovery_method_passkey = /** @type {((inputs?: Recovery_Method_PasskeyInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Method_PasskeyInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_method_passkey(inputs)
	if (locale === "es") return es_recovery_method_passkey(inputs)
	if (locale === "de") return de_recovery_method_passkey(inputs)
	if (locale === "ar") return ar_recovery_method_passkey(inputs)
	if (locale === "fr") return fr_recovery_method_passkey(inputs)
	return ko_recovery_method_passkey(inputs)
});
export { recovery_method_passkey as "recovery.method.passkey" }