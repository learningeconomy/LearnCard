/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Method_Passkeysetup1Inputs */

const en_recovery_method_passkeysetup1 = /** @type {(inputs: Recovery_Method_Passkeysetup1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Passkey is set up`)
};

const es_recovery_method_passkeysetup1 = /** @type {(inputs: Recovery_Method_Passkeysetup1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Clave de acceso configurada`)
};

const fr_recovery_method_passkeysetup1 = /** @type {(inputs: Recovery_Method_Passkeysetup1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Clé d'accès configurée`)
};

const ar_recovery_method_passkeysetup1 = /** @type {(inputs: Recovery_Method_Passkeysetup1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم إعداد مفتاح المرور`)
};

/**
* | output |
* | --- |
* | "Passkey is set up" |
*
* @param {Recovery_Method_Passkeysetup1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_method_passkeysetup1 = /** @type {((inputs?: Recovery_Method_Passkeysetup1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Method_Passkeysetup1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_method_passkeysetup1(inputs)
	if (locale === "es") return es_recovery_method_passkeysetup1(inputs)
	if (locale === "fr") return fr_recovery_method_passkeysetup1(inputs)
	return ar_recovery_method_passkeysetup1(inputs)
});
export { recovery_method_passkeysetup1 as "recovery.method.passkeySetup" }