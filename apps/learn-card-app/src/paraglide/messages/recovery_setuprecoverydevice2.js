/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Setuprecoverydevice2Inputs */

const en_recovery_setuprecoverydevice2 = /** @type {(inputs: Recovery_Setuprecoverydevice2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Set up recovery so you can get back in if you lose this device.`)
};

const es_recovery_setuprecoverydevice2 = /** @type {(inputs: Recovery_Setuprecoverydevice2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configura la recuperación para poder volver si pierdes este dispositivo.`)
};

const de_recovery_setuprecoverydevice2 = /** @type {(inputs: Recovery_Setuprecoverydevice2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Richte die Wiederherstellung ein, damit du wieder Zugriff bekommst, falls du dieses Gerät verlierst.`)
};

const ar_recovery_setuprecoverydevice2 = /** @type {(inputs: Recovery_Setuprecoverydevice2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قم بإعداد الاستعادة لتتمكن من العودة في حال فقدت هذا الجهاز.`)
};

const fr_recovery_setuprecoverydevice2 = /** @type {(inputs: Recovery_Setuprecoverydevice2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configurez la récupération pour pouvoir revenir si vous perdez cet appareil.`)
};

const ko_recovery_setuprecoverydevice2 = /** @type {(inputs: Recovery_Setuprecoverydevice2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이 기기를 잃은 경우 돌아올 수 있도록 복구를 설정하세요.`)
};

/**
* | output |
* | --- |
* | "Set up recovery so you can get back in if you lose this device." |
*
* @param {Recovery_Setuprecoverydevice2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const recovery_setuprecoverydevice2 = /** @type {((inputs?: Recovery_Setuprecoverydevice2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setuprecoverydevice2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setuprecoverydevice2(inputs)
	if (locale === "es") return es_recovery_setuprecoverydevice2(inputs)
	if (locale === "de") return de_recovery_setuprecoverydevice2(inputs)
	if (locale === "ar") return ar_recovery_setuprecoverydevice2(inputs)
	if (locale === "fr") return fr_recovery_setuprecoverydevice2(inputs)
	return ko_recovery_setuprecoverydevice2(inputs)
});
export { recovery_setuprecoverydevice2 as "recovery.setupRecoveryDevice" }