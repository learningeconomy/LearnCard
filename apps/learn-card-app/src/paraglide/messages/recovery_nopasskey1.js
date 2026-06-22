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

const fr_recovery_nopasskey1 = /** @type {(inputs: Recovery_Nopasskey1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune clé d'accès trouvée sur cet appareil.`)
};

const ar_recovery_nopasskey1 = /** @type {(inputs: Recovery_Nopasskey1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم يتم العثور على مفتاح مرور على هذا الجهاز.`)
};

/**
* | output |
* | --- |
* | "No passkey found on this device." |
*
* @param {Recovery_Nopasskey1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_nopasskey1 = /** @type {((inputs?: Recovery_Nopasskey1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Nopasskey1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_nopasskey1(inputs)
	if (locale === "es") return es_recovery_nopasskey1(inputs)
	if (locale === "fr") return fr_recovery_nopasskey1(inputs)
	return ar_recovery_nopasskey1(inputs)
});
export { recovery_nopasskey1 as "recovery.noPasskey" }