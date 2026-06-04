/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Recoveraccount1Inputs */

const en_recovery_recoveraccount1 = /** @type {(inputs: Recovery_Recoveraccount1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recover Account`)
};

const es_recovery_recoveraccount1 = /** @type {(inputs: Recovery_Recoveraccount1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recuperar cuenta`)
};

const de_recovery_recoveraccount1 = /** @type {(inputs: Recovery_Recoveraccount1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Konto wiederherstellen`)
};

const ar_recovery_recoveraccount1 = /** @type {(inputs: Recovery_Recoveraccount1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استعادة الحساب`)
};

const fr_recovery_recoveraccount1 = /** @type {(inputs: Recovery_Recoveraccount1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Récupérer le compte`)
};

const ko_recovery_recoveraccount1 = /** @type {(inputs: Recovery_Recoveraccount1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`계정 복구`)
};

/**
* | output |
* | --- |
* | "Recover Account" |
*
* @param {Recovery_Recoveraccount1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const recovery_recoveraccount1 = /** @type {((inputs?: Recovery_Recoveraccount1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Recoveraccount1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_recoveraccount1(inputs)
	if (locale === "es") return es_recovery_recoveraccount1(inputs)
	if (locale === "de") return de_recovery_recoveraccount1(inputs)
	if (locale === "ar") return ar_recovery_recoveraccount1(inputs)
	if (locale === "fr") return fr_recovery_recoveraccount1(inputs)
	return ko_recovery_recoveraccount1(inputs)
});
export { recovery_recoveraccount1 as "recovery.recoverAccount" }