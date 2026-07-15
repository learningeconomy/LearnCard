/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Passkey_Tapdesc1Inputs */

const en_recovery_passkey_tapdesc1 = /** @type {(inputs: Recovery_Passkey_Tapdesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tap below to verify with Face ID, Touch ID, or your device passkey.`)
};

const es_recovery_passkey_tapdesc1 = /** @type {(inputs: Recovery_Passkey_Tapdesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Toca abajo para verificar con Face ID, Touch ID o tu passkey del dispositivo.`)
};

const fr_recovery_passkey_tapdesc1 = /** @type {(inputs: Recovery_Passkey_Tapdesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Appuyez ci-dessous pour vérifier avec Face ID, Touch ID ou votre clé d'accès.`)
};

const ar_recovery_passkey_tapdesc1 = /** @type {(inputs: Recovery_Passkey_Tapdesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tap below to verify with Face ID, Touch ID, or your device passkey.`)
};

/**
* | output |
* | --- |
* | "Tap below to verify with Face ID, Touch ID, or your device passkey." |
*
* @param {Recovery_Passkey_Tapdesc1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_passkey_tapdesc1 = /** @type {((inputs?: Recovery_Passkey_Tapdesc1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Passkey_Tapdesc1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_passkey_tapdesc1(inputs)
	if (locale === "es") return es_recovery_passkey_tapdesc1(inputs)
	if (locale === "fr") return fr_recovery_passkey_tapdesc1(inputs)
	return ar_recovery_passkey_tapdesc1(inputs)
});
export { recovery_passkey_tapdesc1 as "recovery.passkey.tapDesc" }