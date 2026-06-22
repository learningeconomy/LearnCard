/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Signinfromdevice3Inputs */

const en_recovery_signinfromdevice3 = /** @type {(inputs: Recovery_Signinfromdevice3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sign In from Another Device`)
};

const es_recovery_signinfromdevice3 = /** @type {(inputs: Recovery_Signinfromdevice3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Iniciar sesión desde otro dispositivo`)
};

const fr_recovery_signinfromdevice3 = /** @type {(inputs: Recovery_Signinfromdevice3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Se connecter depuis un autre appareil`)
};

const ar_recovery_signinfromdevice3 = /** @type {(inputs: Recovery_Signinfromdevice3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تسجيل الدخول من جهاز آخر`)
};

/**
* | output |
* | --- |
* | "Sign In from Another Device" |
*
* @param {Recovery_Signinfromdevice3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_signinfromdevice3 = /** @type {((inputs?: Recovery_Signinfromdevice3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Signinfromdevice3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_signinfromdevice3(inputs)
	if (locale === "es") return es_recovery_signinfromdevice3(inputs)
	if (locale === "fr") return fr_recovery_signinfromdevice3(inputs)
	return ar_recovery_signinfromdevice3(inputs)
});
export { recovery_signinfromdevice3 as "recovery.signInFromDevice" }