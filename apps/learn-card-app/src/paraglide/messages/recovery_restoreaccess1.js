/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Restoreaccess1Inputs */

const en_recovery_restoreaccess1 = /** @type {(inputs: Recovery_Restoreaccess1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Restore Access`)
};

const es_recovery_restoreaccess1 = /** @type {(inputs: Recovery_Restoreaccess1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Restaurar acceso`)
};

const de_recovery_restoreaccess1 = /** @type {(inputs: Recovery_Restoreaccess1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Zugang wiederherstellen`)
};

const ar_recovery_restoreaccess1 = /** @type {(inputs: Recovery_Restoreaccess1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استعادة الوصول`)
};

const fr_recovery_restoreaccess1 = /** @type {(inputs: Recovery_Restoreaccess1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Restaurer l'accès`)
};

const ko_recovery_restoreaccess1 = /** @type {(inputs: Recovery_Restoreaccess1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`접근 복원`)
};

/**
* | output |
* | --- |
* | "Restore Access" |
*
* @param {Recovery_Restoreaccess1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const recovery_restoreaccess1 = /** @type {((inputs?: Recovery_Restoreaccess1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Restoreaccess1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_restoreaccess1(inputs)
	if (locale === "es") return es_recovery_restoreaccess1(inputs)
	if (locale === "de") return de_recovery_restoreaccess1(inputs)
	if (locale === "ar") return ar_recovery_restoreaccess1(inputs)
	if (locale === "fr") return fr_recovery_restoreaccess1(inputs)
	return ko_recovery_restoreaccess1(inputs)
});
export { recovery_restoreaccess1 as "recovery.restoreAccess" }