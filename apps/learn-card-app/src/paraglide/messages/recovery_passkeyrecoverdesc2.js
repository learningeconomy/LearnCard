/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Passkeyrecoverdesc2Inputs */

const en_recovery_passkeyrecoverdesc2 = /** @type {(inputs: Recovery_Passkeyrecoverdesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use your device’s biometric authentication to recover.`)
};

const es_recovery_passkeyrecoverdesc2 = /** @type {(inputs: Recovery_Passkeyrecoverdesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Usa la autenticación biométrica de tu dispositivo para recuperar.`)
};

const fr_recovery_passkeyrecoverdesc2 = /** @type {(inputs: Recovery_Passkeyrecoverdesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Utilisez l’authentification biométrique de votre appareil pour récupérer.`)
};

const ar_recovery_passkeyrecoverdesc2 = /** @type {(inputs: Recovery_Passkeyrecoverdesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استخدم المصادقة البيومترية لجهازك للاسترداد.`)
};

/**
* | output |
* | --- |
* | "Use your device’s biometric authentication to recover." |
*
* @param {Recovery_Passkeyrecoverdesc2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_passkeyrecoverdesc2 = /** @type {((inputs?: Recovery_Passkeyrecoverdesc2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Passkeyrecoverdesc2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_passkeyrecoverdesc2(inputs)
	if (locale === "es") return es_recovery_passkeyrecoverdesc2(inputs)
	if (locale === "fr") return fr_recovery_passkeyrecoverdesc2(inputs)
	return ar_recovery_passkeyrecoverdesc2(inputs)
});
export { recovery_passkeyrecoverdesc2 as "recovery.passkeyRecoverDesc" }