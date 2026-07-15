/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Passkey_Verifybtn1Inputs */

const en_recovery_passkey_verifybtn1 = /** @type {(inputs: Recovery_Passkey_Verifybtn1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verify with Passkey`)
};

const es_recovery_passkey_verifybtn1 = /** @type {(inputs: Recovery_Passkey_Verifybtn1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verificar con Passkey`)
};

const fr_recovery_passkey_verifybtn1 = /** @type {(inputs: Recovery_Passkey_Verifybtn1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vérifier avec la clé d'accès`)
};

const ar_recovery_passkey_verifybtn1 = /** @type {(inputs: Recovery_Passkey_Verifybtn1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التحقق باستخدام مفتاح المرور`)
};

/**
* | output |
* | --- |
* | "Verify with Passkey" |
*
* @param {Recovery_Passkey_Verifybtn1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_passkey_verifybtn1 = /** @type {((inputs?: Recovery_Passkey_Verifybtn1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Passkey_Verifybtn1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_passkey_verifybtn1(inputs)
	if (locale === "es") return es_recovery_passkey_verifybtn1(inputs)
	if (locale === "fr") return fr_recovery_passkey_verifybtn1(inputs)
	return ar_recovery_passkey_verifybtn1(inputs)
});
export { recovery_passkey_verifybtn1 as "recovery.passkey.verifyBtn" }