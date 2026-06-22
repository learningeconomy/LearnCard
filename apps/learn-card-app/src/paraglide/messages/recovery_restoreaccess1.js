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

const fr_recovery_restoreaccess1 = /** @type {(inputs: Recovery_Restoreaccess1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Restaurer l'accès`)
};

const ar_recovery_restoreaccess1 = /** @type {(inputs: Recovery_Restoreaccess1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استعادة الوصول`)
};

/**
* | output |
* | --- |
* | "Restore Access" |
*
* @param {Recovery_Restoreaccess1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_restoreaccess1 = /** @type {((inputs?: Recovery_Restoreaccess1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Restoreaccess1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_restoreaccess1(inputs)
	if (locale === "es") return es_recovery_restoreaccess1(inputs)
	if (locale === "fr") return fr_recovery_restoreaccess1(inputs)
	return ar_recovery_restoreaccess1(inputs)
});
export { recovery_restoreaccess1 as "recovery.restoreAccess" }