/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Backup_TitleInputs */

const en_recovery_backup_title = /** @type {(inputs: Recovery_Backup_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Backup File`)
};

const es_recovery_backup_title = /** @type {(inputs: Recovery_Backup_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Archivo de Respaldo`)
};

const fr_recovery_backup_title = /** @type {(inputs: Recovery_Backup_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fichier de sauvegarde`)
};

const ar_recovery_backup_title = /** @type {(inputs: Recovery_Backup_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ملف النسخ الاحتياطي`)
};

/**
* | output |
* | --- |
* | "Backup File" |
*
* @param {Recovery_Backup_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_backup_title = /** @type {((inputs?: Recovery_Backup_TitleInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Backup_TitleInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_backup_title(inputs)
	if (locale === "es") return es_recovery_backup_title(inputs)
	if (locale === "fr") return fr_recovery_backup_title(inputs)
	return ar_recovery_backup_title(inputs)
});
export { recovery_backup_title as "recovery.backup.title" }