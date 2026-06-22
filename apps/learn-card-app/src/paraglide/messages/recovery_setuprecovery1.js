/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Setuprecovery1Inputs */

const en_recovery_setuprecovery1 = /** @type {(inputs: Recovery_Setuprecovery1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Set up a recovery method so you can get back in if you lose access to this device.`)
};

const es_recovery_setuprecovery1 = /** @type {(inputs: Recovery_Setuprecovery1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configura un método de recuperación para poder volver si pierdes acceso a este dispositivo.`)
};

const fr_recovery_setuprecovery1 = /** @type {(inputs: Recovery_Setuprecovery1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configurez une méthode de récupération pour pouvoir revenir si vous perdez l'accès à cet appareil.`)
};

const ar_recovery_setuprecovery1 = /** @type {(inputs: Recovery_Setuprecovery1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قم بإعداد طريقة استعادة لتتمكن من العودة في حال فقدت الوصول إلى هذا الجهاز.`)
};

/**
* | output |
* | --- |
* | "Set up a recovery method so you can get back in if you lose access to this device." |
*
* @param {Recovery_Setuprecovery1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_setuprecovery1 = /** @type {((inputs?: Recovery_Setuprecovery1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setuprecovery1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setuprecovery1(inputs)
	if (locale === "es") return es_recovery_setuprecovery1(inputs)
	if (locale === "fr") return fr_recovery_setuprecovery1(inputs)
	return ar_recovery_setuprecovery1(inputs)
});
export { recovery_setuprecovery1 as "recovery.setupRecovery" }