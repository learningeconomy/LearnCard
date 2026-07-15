/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Device_DescInputs */

const en_recovery_device_desc = /** @type {(inputs: Recovery_Device_DescInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scan the QR code below with a device that's already signed in to your account.`)
};

const es_recovery_device_desc = /** @type {(inputs: Recovery_Device_DescInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Escanea el código QR debajo con un dispositivo que ya haya iniciado sesión en tu cuenta.`)
};

const fr_recovery_device_desc = /** @type {(inputs: Recovery_Device_DescInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scannez le code QR ci-dessous avec un appareil déjà connecté à votre compte.`)
};

const ar_recovery_device_desc = /** @type {(inputs: Recovery_Device_DescInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scan the QR code below with a device that's already signed in to your account.`)
};

/**
* | output |
* | --- |
* | "Scan the QR code below with a device that's already signed in to your account." |
*
* @param {Recovery_Device_DescInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_device_desc = /** @type {((inputs?: Recovery_Device_DescInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Device_DescInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_device_desc(inputs)
	if (locale === "es") return es_recovery_device_desc(inputs)
	if (locale === "fr") return fr_recovery_device_desc(inputs)
	return ar_recovery_device_desc(inputs)
});
export { recovery_device_desc as "recovery.device.desc" }