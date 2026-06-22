/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Newdevicedesc2Inputs */

const en_recovery_newdevicedesc2 = /** @type {(inputs: Recovery_Newdevicedesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This device hasn’t been set up for your account yet. Choose a method to sign in.`)
};

const es_recovery_newdevicedesc2 = /** @type {(inputs: Recovery_Newdevicedesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Este dispositivo aún no ha sido configurado para tu cuenta. Elige un método para iniciar sesión.`)
};

const fr_recovery_newdevicedesc2 = /** @type {(inputs: Recovery_Newdevicedesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cet appareil n’a pas encore été configuré pour votre compte. Choisissez une méthode pour vous connecter.`)
};

const ar_recovery_newdevicedesc2 = /** @type {(inputs: Recovery_Newdevicedesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم يتم إعداد هذا الجهاز لحسابك بعد. اختر طريقة لتسجيل الدخول.`)
};

/**
* | output |
* | --- |
* | "This device hasn’t been set up for your account yet. Choose a method to sign in." |
*
* @param {Recovery_Newdevicedesc2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_newdevicedesc2 = /** @type {((inputs?: Recovery_Newdevicedesc2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Newdevicedesc2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_newdevicedesc2(inputs)
	if (locale === "es") return es_recovery_newdevicedesc2(inputs)
	if (locale === "fr") return fr_recovery_newdevicedesc2(inputs)
	return ar_recovery_newdevicedesc2(inputs)
});
export { recovery_newdevicedesc2 as "recovery.newDeviceDesc" }