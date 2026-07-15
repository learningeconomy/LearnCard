/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Methodpicker_Descnewdevice3Inputs */

const en_recovery_methodpicker_descnewdevice3 = /** @type {(inputs: Recovery_Methodpicker_Descnewdevice3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This device hasn't been set up for your account yet. Choose a method to sign in.`)
};

const es_recovery_methodpicker_descnewdevice3 = /** @type {(inputs: Recovery_Methodpicker_Descnewdevice3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Este dispositivo aún no está configurado para tu cuenta. Elige un método para iniciar sesión.`)
};

const fr_recovery_methodpicker_descnewdevice3 = /** @type {(inputs: Recovery_Methodpicker_Descnewdevice3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cet appareil n'a pas encore été configuré pour votre compte. Choisissez une méthode pour vous connecter.`)
};

const ar_recovery_methodpicker_descnewdevice3 = /** @type {(inputs: Recovery_Methodpicker_Descnewdevice3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم يتم إعداد هذا الجهاز لحسابك بعد. اختر طريقة لتسجيل الدخول.`)
};

/**
* | output |
* | --- |
* | "This device hasn't been set up for your account yet. Choose a method to sign in." |
*
* @param {Recovery_Methodpicker_Descnewdevice3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_methodpicker_descnewdevice3 = /** @type {((inputs?: Recovery_Methodpicker_Descnewdevice3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Methodpicker_Descnewdevice3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_methodpicker_descnewdevice3(inputs)
	if (locale === "es") return es_recovery_methodpicker_descnewdevice3(inputs)
	if (locale === "fr") return fr_recovery_methodpicker_descnewdevice3(inputs)
	return ar_recovery_methodpicker_descnewdevice3(inputs)
});
export { recovery_methodpicker_descnewdevice3 as "recovery.methodPicker.descNewDevice" }