/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Scanqrdescription2Inputs */

const en_recovery_scanqrdescription2 = /** @type {(inputs: Recovery_Scanqrdescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scan the QR code below with a device that’s already signed in to your account.`)
};

const es_recovery_scanqrdescription2 = /** @type {(inputs: Recovery_Scanqrdescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Escanea el código QR a continuación con un dispositivo que ya haya iniciado sesión en tu cuenta.`)
};

const fr_recovery_scanqrdescription2 = /** @type {(inputs: Recovery_Scanqrdescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scannez le code QR ci-dessous avec un appareil déjà connecté à votre compte.`)
};

const ar_recovery_scanqrdescription2 = /** @type {(inputs: Recovery_Scanqrdescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`امسح رمز QR أدناه بجهاز مسجل الدخول بالفعل إلى حسابك.`)
};

/**
* | output |
* | --- |
* | "Scan the QR code below with a device that’s already signed in to your account." |
*
* @param {Recovery_Scanqrdescription2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_scanqrdescription2 = /** @type {((inputs?: Recovery_Scanqrdescription2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Scanqrdescription2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_scanqrdescription2(inputs)
	if (locale === "es") return es_recovery_scanqrdescription2(inputs)
	if (locale === "fr") return fr_recovery_scanqrdescription2(inputs)
	return ar_recovery_scanqrdescription2(inputs)
});
export { recovery_scanqrdescription2 as "recovery.scanQrDescription" }