/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Passkey_DescInputs */

const en_recovery_passkey_desc = /** @type {(inputs: Recovery_Passkey_DescInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use your device's biometric authentication to recover.`)
};

const es_recovery_passkey_desc = /** @type {(inputs: Recovery_Passkey_DescInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Usa la autenticación biométrica de tu dispositivo para recuperar.`)
};

const fr_recovery_passkey_desc = /** @type {(inputs: Recovery_Passkey_DescInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Utilisez l'authentification biométrique de votre appareil pour récupérer votre compte.`)
};

const ar_recovery_passkey_desc = /** @type {(inputs: Recovery_Passkey_DescInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use your device's biometric authentication to recover.`)
};

/**
* | output |
* | --- |
* | "Use your device's biometric authentication to recover." |
*
* @param {Recovery_Passkey_DescInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_passkey_desc = /** @type {((inputs?: Recovery_Passkey_DescInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Passkey_DescInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_passkey_desc(inputs)
	if (locale === "es") return es_recovery_passkey_desc(inputs)
	if (locale === "fr") return fr_recovery_passkey_desc(inputs)
	return ar_recovery_passkey_desc(inputs)
});
export { recovery_passkey_desc as "recovery.passkey.desc" }