/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Setup_Backup_Readytitle1Inputs */

const en_recovery_setup_backup_readytitle1 = /** @type {(inputs: Recovery_Setup_Backup_Readytitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Backup file ready`)
};

const es_recovery_setup_backup_readytitle1 = /** @type {(inputs: Recovery_Setup_Backup_Readytitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Archivo de respaldo listo`)
};

const fr_recovery_setup_backup_readytitle1 = /** @type {(inputs: Recovery_Setup_Backup_Readytitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fichier de sauvegarde prêt`)
};

const ar_recovery_setup_backup_readytitle1 = /** @type {(inputs: Recovery_Setup_Backup_Readytitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ملف النسخ الاحتياطي جاهز`)
};

/**
* | output |
* | --- |
* | "Backup file ready" |
*
* @param {Recovery_Setup_Backup_Readytitle1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_setup_backup_readytitle1 = /** @type {((inputs?: Recovery_Setup_Backup_Readytitle1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setup_Backup_Readytitle1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setup_backup_readytitle1(inputs)
	if (locale === "es") return es_recovery_setup_backup_readytitle1(inputs)
	if (locale === "fr") return fr_recovery_setup_backup_readytitle1(inputs)
	return ar_recovery_setup_backup_readytitle1(inputs)
});
export { recovery_setup_backup_readytitle1 as "recovery.setup.backup.readyTitle" }