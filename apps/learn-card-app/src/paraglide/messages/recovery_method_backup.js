/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Method_BackupInputs */

const en_recovery_method_backup = /** @type {(inputs: Recovery_Method_BackupInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Backup File`)
};

const es_recovery_method_backup = /** @type {(inputs: Recovery_Method_BackupInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Archivo de respaldo`)
};

const de_recovery_method_backup = /** @type {(inputs: Recovery_Method_BackupInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sicherungsdatei`)
};

const ar_recovery_method_backup = /** @type {(inputs: Recovery_Method_BackupInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ملف النسخ الاحتياطي`)
};

const fr_recovery_method_backup = /** @type {(inputs: Recovery_Method_BackupInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fichier de sauvegarde`)
};

const ko_recovery_method_backup = /** @type {(inputs: Recovery_Method_BackupInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`백업 파일`)
};

/**
* | output |
* | --- |
* | "Backup File" |
*
* @param {Recovery_Method_BackupInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const recovery_method_backup = /** @type {((inputs?: Recovery_Method_BackupInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Method_BackupInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_method_backup(inputs)
	if (locale === "es") return es_recovery_method_backup(inputs)
	if (locale === "de") return de_recovery_method_backup(inputs)
	if (locale === "ar") return ar_recovery_method_backup(inputs)
	if (locale === "fr") return fr_recovery_method_backup(inputs)
	return ko_recovery_method_backup(inputs)
});
export { recovery_method_backup as "recovery.method.backup" }