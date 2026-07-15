/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Setup_Backup_Createdrow1Inputs */

const en_recovery_setup_backup_createdrow1 = /** @type {(inputs: Recovery_Setup_Backup_Createdrow1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Backup file created`)
};

const es_recovery_setup_backup_createdrow1 = /** @type {(inputs: Recovery_Setup_Backup_Createdrow1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Archivo de respaldo creado`)
};

const fr_recovery_setup_backup_createdrow1 = /** @type {(inputs: Recovery_Setup_Backup_Createdrow1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fichier de sauvegarde créé`)
};

const ar_recovery_setup_backup_createdrow1 = /** @type {(inputs: Recovery_Setup_Backup_Createdrow1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم إنشاء ملف النسخ الاحتياطي`)
};

/**
* | output |
* | --- |
* | "Backup file created" |
*
* @param {Recovery_Setup_Backup_Createdrow1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_setup_backup_createdrow1 = /** @type {((inputs?: Recovery_Setup_Backup_Createdrow1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setup_Backup_Createdrow1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setup_backup_createdrow1(inputs)
	if (locale === "es") return es_recovery_setup_backup_createdrow1(inputs)
	if (locale === "fr") return fr_recovery_setup_backup_createdrow1(inputs)
	return ar_recovery_setup_backup_createdrow1(inputs)
});
export { recovery_setup_backup_createdrow1 as "recovery.setup.backup.createdRow" }