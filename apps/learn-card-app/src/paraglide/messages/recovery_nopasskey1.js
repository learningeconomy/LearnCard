/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Nopasskey1Inputs */

const en_recovery_nopasskey1 = /** @type {(inputs: Recovery_Nopasskey1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No passkey found on this device.`)
};

const es_recovery_nopasskey1 = /** @type {(inputs: Recovery_Nopasskey1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se encontró una clave de acceso en este dispositivo.`)
};

const de_recovery_nopasskey1 = /** @type {(inputs: Recovery_Nopasskey1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Kein Passkey auf diesem Gerät gefunden.`)
};

const ar_recovery_nopasskey1 = /** @type {(inputs: Recovery_Nopasskey1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم يتم العثور على مفتاح مرور على هذا الجهاز.`)
};

const fr_recovery_nopasskey1 = /** @type {(inputs: Recovery_Nopasskey1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune clé d'accès trouvée sur cet appareil.`)
};

const ko_recovery_nopasskey1 = /** @type {(inputs: Recovery_Nopasskey1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이 기기에서 패스키를 찾을 수 없습니다.`)
};

/**
* | output |
* | --- |
* | "No passkey found on this device." |
*
* @param {Recovery_Nopasskey1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const recovery_nopasskey1 = /** @type {((inputs?: Recovery_Nopasskey1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Nopasskey1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_nopasskey1(inputs)
	if (locale === "es") return es_recovery_nopasskey1(inputs)
	if (locale === "de") return de_recovery_nopasskey1(inputs)
	if (locale === "ar") return ar_recovery_nopasskey1(inputs)
	if (locale === "fr") return fr_recovery_nopasskey1(inputs)
	return ko_recovery_nopasskey1(inputs)
});
export { recovery_nopasskey1 as "recovery.noPasskey" }