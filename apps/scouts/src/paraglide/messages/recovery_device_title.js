/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Device_TitleInputs */

const en_recovery_device_title = /** @type {(inputs: Recovery_Device_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sign In from Another Device`)
};

const es_recovery_device_title = /** @type {(inputs: Recovery_Device_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Iniciar Sesión desde Otro Dispositivo`)
};

const fr_recovery_device_title = /** @type {(inputs: Recovery_Device_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connectez-vous depuis un autre appareil`)
};

const ar_recovery_device_title = /** @type {(inputs: Recovery_Device_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تسجيل الدخول من جهاز آخر`)
};

/**
* | output |
* | --- |
* | "Sign In from Another Device" |
*
* @param {Recovery_Device_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_device_title = /** @type {((inputs?: Recovery_Device_TitleInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Device_TitleInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_device_title(inputs)
	if (locale === "es") return es_recovery_device_title(inputs)
	if (locale === "fr") return fr_recovery_device_title(inputs)
	return ar_recovery_device_title(inputs)
});
export { recovery_device_title as "recovery.device.title" }