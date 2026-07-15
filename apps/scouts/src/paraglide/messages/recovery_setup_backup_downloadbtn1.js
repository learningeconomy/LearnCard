/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Setup_Backup_Downloadbtn1Inputs */

const en_recovery_setup_backup_downloadbtn1 = /** @type {(inputs: Recovery_Setup_Backup_Downloadbtn1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Download Backup File`)
};

const es_recovery_setup_backup_downloadbtn1 = /** @type {(inputs: Recovery_Setup_Backup_Downloadbtn1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Descargar Archivo de Respaldo`)
};

const fr_recovery_setup_backup_downloadbtn1 = /** @type {(inputs: Recovery_Setup_Backup_Downloadbtn1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Télécharger le fichier de sauvegarde`)
};

const ar_recovery_setup_backup_downloadbtn1 = /** @type {(inputs: Recovery_Setup_Backup_Downloadbtn1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تنزيل ملف النسخ الاحتياطي`)
};

/**
* | output |
* | --- |
* | "Download Backup File" |
*
* @param {Recovery_Setup_Backup_Downloadbtn1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_setup_backup_downloadbtn1 = /** @type {((inputs?: Recovery_Setup_Backup_Downloadbtn1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setup_Backup_Downloadbtn1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setup_backup_downloadbtn1(inputs)
	if (locale === "es") return es_recovery_setup_backup_downloadbtn1(inputs)
	if (locale === "fr") return fr_recovery_setup_backup_downloadbtn1(inputs)
	return ar_recovery_setup_backup_downloadbtn1(inputs)
});
export { recovery_setup_backup_downloadbtn1 as "recovery.setup.backup.downloadBtn" }