/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Backup_DescInputs */

const en_recovery_backup_desc = /** @type {(inputs: Recovery_Backup_DescInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Upload your backup file and enter the password you used when creating it.`)
};

const es_recovery_backup_desc = /** @type {(inputs: Recovery_Backup_DescInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sube tu archivo de respaldo e ingresa la contraseña que usaste al crearlo.`)
};

const fr_recovery_backup_desc = /** @type {(inputs: Recovery_Backup_DescInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Téléchargez votre fichier de sauvegarde et saisissez le mot de passe que vous avez utilisé lors de sa création.`)
};

const ar_recovery_backup_desc = /** @type {(inputs: Recovery_Backup_DescInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ارفع ملف النسخ الاحتياطي الخاص بك وأدخل كلمة المرور التي استخدمتها عند إنشائه.`)
};

/**
* | output |
* | --- |
* | "Upload your backup file and enter the password you used when creating it." |
*
* @param {Recovery_Backup_DescInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_backup_desc = /** @type {((inputs?: Recovery_Backup_DescInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Backup_DescInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_backup_desc(inputs)
	if (locale === "es") return es_recovery_backup_desc(inputs)
	if (locale === "fr") return fr_recovery_backup_desc(inputs)
	return ar_recovery_backup_desc(inputs)
});
export { recovery_backup_desc as "recovery.backup.desc" }