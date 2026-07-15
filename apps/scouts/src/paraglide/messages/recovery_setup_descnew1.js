/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Setup_Descnew1Inputs */

const en_recovery_setup_descnew1 = /** @type {(inputs: Recovery_Setup_Descnew1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Set up a recovery method so you can get back in if you lose access to this device.`)
};

const es_recovery_setup_descnew1 = /** @type {(inputs: Recovery_Setup_Descnew1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configura un método de recuperación para poder acceder de nuevo si pierdes el acceso a este dispositivo.`)
};

const fr_recovery_setup_descnew1 = /** @type {(inputs: Recovery_Setup_Descnew1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configurez une méthode de récupération pour pouvoir retrouver l'accès si vous perdez cet appareil.`)
};

const ar_recovery_setup_descnew1 = /** @type {(inputs: Recovery_Setup_Descnew1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قم بإعداد طريقة استرداد لتتمكن من العودة إذا فقدت الوصول إلى هذا الجهاز.`)
};

/**
* | output |
* | --- |
* | "Set up a recovery method so you can get back in if you lose access to this device." |
*
* @param {Recovery_Setup_Descnew1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_setup_descnew1 = /** @type {((inputs?: Recovery_Setup_Descnew1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setup_Descnew1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setup_descnew1(inputs)
	if (locale === "es") return es_recovery_setup_descnew1(inputs)
	if (locale === "fr") return fr_recovery_setup_descnew1(inputs)
	return ar_recovery_setup_descnew1(inputs)
});
export { recovery_setup_descnew1 as "recovery.setup.descNew" }