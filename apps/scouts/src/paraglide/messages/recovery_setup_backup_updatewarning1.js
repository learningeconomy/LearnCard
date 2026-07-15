/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Setup_Backup_Updatewarning1Inputs */

const en_recovery_setup_backup_updatewarning1 = /** @type {(inputs: Recovery_Setup_Backup_Updatewarning1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This will generate a new backup file. Your previous backup file will no longer work.`)
};

const es_recovery_setup_backup_updatewarning1 = /** @type {(inputs: Recovery_Setup_Backup_Updatewarning1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Esto generará un nuevo archivo de respaldo. Tu archivo de respaldo anterior ya no funcionará.`)
};

const fr_recovery_setup_backup_updatewarning1 = /** @type {(inputs: Recovery_Setup_Backup_Updatewarning1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cela générera un nouveau fichier de sauvegarde. Votre précédent fichier de sauvegarde ne fonctionnera plus.`)
};

const ar_recovery_setup_backup_updatewarning1 = /** @type {(inputs: Recovery_Setup_Backup_Updatewarning1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This will generate a new backup file. Your previous backup file will no longer work.`)
};

/**
* | output |
* | --- |
* | "This will generate a new backup file. Your previous backup file will no longer work." |
*
* @param {Recovery_Setup_Backup_Updatewarning1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_setup_backup_updatewarning1 = /** @type {((inputs?: Recovery_Setup_Backup_Updatewarning1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setup_Backup_Updatewarning1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setup_backup_updatewarning1(inputs)
	if (locale === "es") return es_recovery_setup_backup_updatewarning1(inputs)
	if (locale === "fr") return fr_recovery_setup_backup_updatewarning1(inputs)
	return ar_recovery_setup_backup_updatewarning1(inputs)
});
export { recovery_setup_backup_updatewarning1 as "recovery.setup.backup.updateWarning" }