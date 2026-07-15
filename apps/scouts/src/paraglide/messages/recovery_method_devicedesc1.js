/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Method_Devicedesc1Inputs */

const en_recovery_method_devicedesc1 = /** @type {(inputs: Recovery_Method_Devicedesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scan a code from a signed-in device`)
};

const es_recovery_method_devicedesc1 = /** @type {(inputs: Recovery_Method_Devicedesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Escanea un código desde un dispositivo con sesión iniciada`)
};

const fr_recovery_method_devicedesc1 = /** @type {(inputs: Recovery_Method_Devicedesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scannez un code depuis un appareil connecté`)
};

const ar_recovery_method_devicedesc1 = /** @type {(inputs: Recovery_Method_Devicedesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scan a code from a signed-in device`)
};

/**
* | output |
* | --- |
* | "Scan a code from a signed-in device" |
*
* @param {Recovery_Method_Devicedesc1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_method_devicedesc1 = /** @type {((inputs?: Recovery_Method_Devicedesc1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Method_Devicedesc1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_method_devicedesc1(inputs)
	if (locale === "es") return es_recovery_method_devicedesc1(inputs)
	if (locale === "fr") return fr_recovery_method_devicedesc1(inputs)
	return ar_recovery_method_devicedesc1(inputs)
});
export { recovery_method_devicedesc1 as "recovery.method.deviceDesc" }