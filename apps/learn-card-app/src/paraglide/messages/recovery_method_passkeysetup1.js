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

const de_recovery_method_passkeysetup1 = /** @type {(inputs: Recovery_Method_Passkeysetup1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Passkey ist eingerichtet`)
};

const ar_recovery_method_passkeysetup1 = /** @type {(inputs: Recovery_Method_Passkeysetup1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم إعداد مفتاح المرور`)
};

const fr_recovery_method_passkeysetup1 = /** @type {(inputs: Recovery_Method_Passkeysetup1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Clé d'accès configurée`)
};

const ko_recovery_method_passkeysetup1 = /** @type {(inputs: Recovery_Method_Passkeysetup1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`패스키가 설정됨`)
};

/**
* | output |
* | --- |
* | "Passkey is set up" |
*
* @param {Recovery_Method_Passkeysetup1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const recovery_method_passkeysetup1 = /** @type {((inputs?: Recovery_Method_Passkeysetup1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Method_Passkeysetup1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_method_passkeysetup1(inputs)
	if (locale === "es") return es_recovery_method_passkeysetup1(inputs)
	if (locale === "de") return de_recovery_method_passkeysetup1(inputs)
	if (locale === "ar") return ar_recovery_method_passkeysetup1(inputs)
	if (locale === "fr") return fr_recovery_method_passkeysetup1(inputs)
	return ko_recovery_method_passkeysetup1(inputs)
});
export { recovery_method_passkeysetup1 as "recovery.method.passkeySetup" }