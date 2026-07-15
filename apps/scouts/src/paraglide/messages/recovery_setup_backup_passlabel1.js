/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Setup_Backup_Passlabel1Inputs */

const en_recovery_setup_backup_passlabel1 = /** @type {(inputs: Recovery_Setup_Backup_Passlabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Backup Password`)
};

const es_recovery_setup_backup_passlabel1 = /** @type {(inputs: Recovery_Setup_Backup_Passlabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contraseña de Respaldo`)
};

const fr_recovery_setup_backup_passlabel1 = /** @type {(inputs: Recovery_Setup_Backup_Passlabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mot de passe de la sauvegarde`)
};

const ar_recovery_setup_backup_passlabel1 = /** @type {(inputs: Recovery_Setup_Backup_Passlabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`كلمة مرور النسخ الاحتياطي`)
};

/**
* | output |
* | --- |
* | "Backup Password" |
*
* @param {Recovery_Setup_Backup_Passlabel1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_setup_backup_passlabel1 = /** @type {((inputs?: Recovery_Setup_Backup_Passlabel1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setup_Backup_Passlabel1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setup_backup_passlabel1(inputs)
	if (locale === "es") return es_recovery_setup_backup_passlabel1(inputs)
	if (locale === "fr") return fr_recovery_setup_backup_passlabel1(inputs)
	return ar_recovery_setup_backup_passlabel1(inputs)
});
export { recovery_setup_backup_passlabel1 as "recovery.setup.backup.passLabel" }