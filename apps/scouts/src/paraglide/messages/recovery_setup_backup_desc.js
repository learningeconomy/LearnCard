/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Setup_Backup_DescInputs */

const en_recovery_setup_backup_desc = /** @type {(inputs: Recovery_Setup_Backup_DescInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generate an encrypted backup file protected by a password. Store it somewhere safe — you'll need both the file and the password to recover.`)
};

const es_recovery_setup_backup_desc = /** @type {(inputs: Recovery_Setup_Backup_DescInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Genera un archivo de respaldo cifrado protegido por una contraseña. Guárdalo en un lugar seguro — necesitarás tanto el archivo como la contraseña.`)
};

const fr_recovery_setup_backup_desc = /** @type {(inputs: Recovery_Setup_Backup_DescInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Générez un fichier de sauvegarde chiffré protégé par un mot de passe. Stockez-le dans un endroit sûr — vous aurez besoin du fichier et du mot de passe pour récupérer.`)
};

const ar_recovery_setup_backup_desc = /** @type {(inputs: Recovery_Setup_Backup_DescInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generate an encrypted backup file protected by a password. Store it somewhere safe — you'll need both the file and the password to recover.`)
};

/**
* | output |
* | --- |
* | "Generate an encrypted backup file protected by a password. Store it somewhere safe — you'll need both the file and the password to recover." |
*
* @param {Recovery_Setup_Backup_DescInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_setup_backup_desc = /** @type {((inputs?: Recovery_Setup_Backup_DescInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setup_Backup_DescInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setup_backup_desc(inputs)
	if (locale === "es") return es_recovery_setup_backup_desc(inputs)
	if (locale === "fr") return fr_recovery_setup_backup_desc(inputs)
	return ar_recovery_setup_backup_desc(inputs)
});
export { recovery_setup_backup_desc as "recovery.setup.backup.desc" }