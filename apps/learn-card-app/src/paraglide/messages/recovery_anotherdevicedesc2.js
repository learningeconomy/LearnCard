/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Anotherdevicedesc2Inputs */

const en_recovery_anotherdevicedesc2 = /** @type {(inputs: Recovery_Anotherdevicedesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scan a code from a signed-in device`)
};

const es_recovery_anotherdevicedesc2 = /** @type {(inputs: Recovery_Anotherdevicedesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Escanea un código desde un dispositivo con sesión iniciada`)
};

const fr_recovery_anotherdevicedesc2 = /** @type {(inputs: Recovery_Anotherdevicedesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scannez un code depuis un appareil connecté`)
};

const ar_recovery_anotherdevicedesc2 = /** @type {(inputs: Recovery_Anotherdevicedesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`امسح رمزًا من جهاز مسجل الدخول`)
};

/**
* | output |
* | --- |
* | "Scan a code from a signed-in device" |
*
* @param {Recovery_Anotherdevicedesc2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_anotherdevicedesc2 = /** @type {((inputs?: Recovery_Anotherdevicedesc2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Anotherdevicedesc2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_anotherdevicedesc2(inputs)
	if (locale === "es") return es_recovery_anotherdevicedesc2(inputs)
	if (locale === "fr") return fr_recovery_anotherdevicedesc2(inputs)
	return ar_recovery_anotherdevicedesc2(inputs)
});
export { recovery_anotherdevicedesc2 as "recovery.anotherDeviceDesc" }