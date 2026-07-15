/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Method_Backuplabel1Inputs */

const en_recovery_method_backuplabel1 = /** @type {(inputs: Recovery_Method_Backuplabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Backup File`)
};

const es_recovery_method_backuplabel1 = /** @type {(inputs: Recovery_Method_Backuplabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Archivo de Respaldo`)
};

const fr_recovery_method_backuplabel1 = /** @type {(inputs: Recovery_Method_Backuplabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fichier de sauvegarde`)
};

const ar_recovery_method_backuplabel1 = /** @type {(inputs: Recovery_Method_Backuplabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ملف النسخ الاحتياطي`)
};

/**
* | output |
* | --- |
* | "Backup File" |
*
* @param {Recovery_Method_Backuplabel1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_method_backuplabel1 = /** @type {((inputs?: Recovery_Method_Backuplabel1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Method_Backuplabel1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_method_backuplabel1(inputs)
	if (locale === "es") return es_recovery_method_backuplabel1(inputs)
	if (locale === "fr") return fr_recovery_method_backuplabel1(inputs)
	return ar_recovery_method_backuplabel1(inputs)
});
export { recovery_method_backuplabel1 as "recovery.method.backupLabel" }