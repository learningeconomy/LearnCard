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

const de_recovery_setuprecovery1 = /** @type {(inputs: Recovery_Setuprecovery1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Richte eine Wiederherstellungsmethode ein, damit du wieder Zugriff bekommst, falls du dieses Gerät verlierst.`)
};

const ar_recovery_setuprecovery1 = /** @type {(inputs: Recovery_Setuprecovery1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قم بإعداد طريقة استعادة لتتمكن من العودة في حال فقدت الوصول إلى هذا الجهاز.`)
};

const fr_recovery_setuprecovery1 = /** @type {(inputs: Recovery_Setuprecovery1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configurez une méthode de récupération pour pouvoir revenir si vous perdez l'accès à cet appareil.`)
};

const ko_recovery_setuprecovery1 = /** @type {(inputs: Recovery_Setuprecovery1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이 기기에 대한 접근을 잃은 경우 돌아올 수 있도록 복구 방법을 설정하세요.`)
};

/**
* | output |
* | --- |
* | "Set up a recovery method so you can get back in if you lose access to this device." |
*
* @param {Recovery_Setuprecovery1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const recovery_setuprecovery1 = /** @type {((inputs?: Recovery_Setuprecovery1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setuprecovery1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setuprecovery1(inputs)
	if (locale === "es") return es_recovery_setuprecovery1(inputs)
	if (locale === "de") return de_recovery_setuprecovery1(inputs)
	if (locale === "ar") return ar_recovery_setuprecovery1(inputs)
	if (locale === "fr") return fr_recovery_setuprecovery1(inputs)
	return ko_recovery_setuprecovery1(inputs)
});
export { recovery_setuprecovery1 as "recovery.setupRecovery" }