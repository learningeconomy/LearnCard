/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Method_Backupdesc1Inputs */

const en_recovery_method_backupdesc1 = /** @type {(inputs: Recovery_Method_Backupdesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Upload your backup file`)
};

const es_recovery_method_backupdesc1 = /** @type {(inputs: Recovery_Method_Backupdesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sube tu archivo de respaldo`)
};

const fr_recovery_method_backupdesc1 = /** @type {(inputs: Recovery_Method_Backupdesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Téléchargez votre fichier de sauvegarde`)
};

const ar_recovery_method_backupdesc1 = /** @type {(inputs: Recovery_Method_Backupdesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ارفع ملف النسخ الاحتياطي`)
};

/**
* | output |
* | --- |
* | "Upload your backup file" |
*
* @param {Recovery_Method_Backupdesc1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_method_backupdesc1 = /** @type {((inputs?: Recovery_Method_Backupdesc1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Method_Backupdesc1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_method_backupdesc1(inputs)
	if (locale === "es") return es_recovery_method_backupdesc1(inputs)
	if (locale === "fr") return fr_recovery_method_backupdesc1(inputs)
	return ar_recovery_method_backupdesc1(inputs)
});
export { recovery_method_backupdesc1 as "recovery.method.backupDesc" }