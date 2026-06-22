/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Passkeyverifydesc2Inputs */

const en_recovery_passkeyverifydesc2 = /** @type {(inputs: Recovery_Passkeyverifydesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tap below to verify with Face ID, Touch ID, or your device passkey.`)
};

const es_recovery_passkeyverifydesc2 = /** @type {(inputs: Recovery_Passkeyverifydesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Toca abajo para verificar con Face ID, Touch ID o la clave de acceso de tu dispositivo.`)
};

const fr_recovery_passkeyverifydesc2 = /** @type {(inputs: Recovery_Passkeyverifydesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Appuyez ci-dessous pour vérifier avec Face ID, Touch ID ou la clé d’accès de votre appareil.`)
};

const ar_recovery_passkeyverifydesc2 = /** @type {(inputs: Recovery_Passkeyverifydesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اضغط أدناه للتحقق باستخدام Face ID أو Touch ID أو مفتاح مرور جهازك.`)
};

/**
* | output |
* | --- |
* | "Tap below to verify with Face ID, Touch ID, or your device passkey." |
*
* @param {Recovery_Passkeyverifydesc2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_passkeyverifydesc2 = /** @type {((inputs?: Recovery_Passkeyverifydesc2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Passkeyverifydesc2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_passkeyverifydesc2(inputs)
	if (locale === "es") return es_recovery_passkeyverifydesc2(inputs)
	if (locale === "fr") return fr_recovery_passkeyverifydesc2(inputs)
	return ar_recovery_passkeyverifydesc2(inputs)
});
export { recovery_passkeyverifydesc2 as "recovery.passkeyVerifyDesc" }