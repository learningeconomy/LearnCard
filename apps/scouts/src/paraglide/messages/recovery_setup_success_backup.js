/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Setup_Success_BackupInputs */

const en_recovery_setup_success_backup = /** @type {(inputs: Recovery_Setup_Success_BackupInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Backup file saved! Keep it and your password somewhere safe.`)
};

const es_recovery_setup_success_backup = /** @type {(inputs: Recovery_Setup_Success_BackupInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Archivo de respaldo guardado! Mantenlo y tu contraseña en un lugar seguro.`)
};

const fr_recovery_setup_success_backup = /** @type {(inputs: Recovery_Setup_Success_BackupInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fichier de sauvegarde sauvegardé ! Conservez-le ainsi que votre mot de passe dans un endroit sûr.`)
};

const ar_recovery_setup_success_backup = /** @type {(inputs: Recovery_Setup_Success_BackupInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم حفظ ملف النسخ الاحتياطي! احتفظ به وبكلمة مرورك في مكان آمن.`)
};

/**
* | output |
* | --- |
* | "Backup file saved! Keep it and your password somewhere safe." |
*
* @param {Recovery_Setup_Success_BackupInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_setup_success_backup = /** @type {((inputs?: Recovery_Setup_Success_BackupInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setup_Success_BackupInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setup_success_backup(inputs)
	if (locale === "es") return es_recovery_setup_success_backup(inputs)
	if (locale === "fr") return fr_recovery_setup_success_backup(inputs)
	return ar_recovery_setup_success_backup(inputs)
});
export { recovery_setup_success_backup as "recovery.setup.success.backup" }