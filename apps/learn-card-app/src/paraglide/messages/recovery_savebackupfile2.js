/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Savebackupfile2Inputs */

const en_recovery_savebackupfile2 = /** @type {(inputs: Recovery_Savebackupfile2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Save your backup file`)
};

const es_recovery_savebackupfile2 = /** @type {(inputs: Recovery_Savebackupfile2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guarda tu archivo de respaldo`)
};

const fr_recovery_savebackupfile2 = /** @type {(inputs: Recovery_Savebackupfile2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sauvegardez votre fichier de sauvegarde`)
};

const ar_recovery_savebackupfile2 = /** @type {(inputs: Recovery_Savebackupfile2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`احفظ ملف النسخ الاحتياطي`)
};

/**
* | output |
* | --- |
* | "Save your backup file" |
*
* @param {Recovery_Savebackupfile2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_savebackupfile2 = /** @type {((inputs?: Recovery_Savebackupfile2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Savebackupfile2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_savebackupfile2(inputs)
	if (locale === "es") return es_recovery_savebackupfile2(inputs)
	if (locale === "fr") return fr_recovery_savebackupfile2(inputs)
	return ar_recovery_savebackupfile2(inputs)
});
export { recovery_savebackupfile2 as "recovery.saveBackupFile" }