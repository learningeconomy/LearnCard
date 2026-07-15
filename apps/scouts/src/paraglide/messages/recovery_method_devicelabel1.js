/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Method_Devicelabel1Inputs */

const en_recovery_method_devicelabel1 = /** @type {(inputs: Recovery_Method_Devicelabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Another Device`)
};

const es_recovery_method_devicelabel1 = /** @type {(inputs: Recovery_Method_Devicelabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Otro Dispositivo`)
};

const fr_recovery_method_devicelabel1 = /** @type {(inputs: Recovery_Method_Devicelabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Un autre appareil`)
};

const ar_recovery_method_devicelabel1 = /** @type {(inputs: Recovery_Method_Devicelabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Another Device`)
};

/**
* | output |
* | --- |
* | "Another Device" |
*
* @param {Recovery_Method_Devicelabel1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_method_devicelabel1 = /** @type {((inputs?: Recovery_Method_Devicelabel1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Method_Devicelabel1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_method_devicelabel1(inputs)
	if (locale === "es") return es_recovery_method_devicelabel1(inputs)
	if (locale === "fr") return fr_recovery_method_devicelabel1(inputs)
	return ar_recovery_method_devicelabel1(inputs)
});
export { recovery_method_devicelabel1 as "recovery.method.deviceLabel" }