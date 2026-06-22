/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Passkeybiometric1Inputs */

const en_recovery_passkeybiometric1 = /** @type {(inputs: Recovery_Passkeybiometric1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Uses your device's secure biometric authentication`)
};

const es_recovery_passkeybiometric1 = /** @type {(inputs: Recovery_Passkeybiometric1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Usa la autenticación biométrica segura de tu dispositivo`)
};

const fr_recovery_passkeybiometric1 = /** @type {(inputs: Recovery_Passkeybiometric1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Utilise l'authentification biométrique sécurisée de votre appareil`)
};

const ar_recovery_passkeybiometric1 = /** @type {(inputs: Recovery_Passkeybiometric1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يستخدم المصادقة البيومترية الآمنة لجهازك`)
};

/**
* | output |
* | --- |
* | "Uses your device's secure biometric authentication" |
*
* @param {Recovery_Passkeybiometric1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_passkeybiometric1 = /** @type {((inputs?: Recovery_Passkeybiometric1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Passkeybiometric1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_passkeybiometric1(inputs)
	if (locale === "es") return es_recovery_passkeybiometric1(inputs)
	if (locale === "fr") return fr_recovery_passkeybiometric1(inputs)
	return ar_recovery_passkeybiometric1(inputs)
});
export { recovery_passkeybiometric1 as "recovery.passkeyBiometric" }