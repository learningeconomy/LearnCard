/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Setup_Backup_Readydesc1Inputs */

const en_recovery_setup_backup_readydesc1 = /** @type {(inputs: Recovery_Setup_Backup_Readydesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Download this file and store it somewhere safe. You'll need it along with your backup password to recover.`)
};

const es_recovery_setup_backup_readydesc1 = /** @type {(inputs: Recovery_Setup_Backup_Readydesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Descarga este archivo y guárdalo en un lugar seguro. Lo necesitarás junto con tu contraseña de respaldo.`)
};

const fr_recovery_setup_backup_readydesc1 = /** @type {(inputs: Recovery_Setup_Backup_Readydesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Téléchargez ce fichier et stockez-le dans un endroit sûr. Vous en aurez besoin avec votre mot de passe de sauvegarde pour récupérer.`)
};

const ar_recovery_setup_backup_readydesc1 = /** @type {(inputs: Recovery_Setup_Backup_Readydesc1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نزّل هذا الملف وخزّنه في مكان آمن. ستحتاج إليه مع كلمة مرور النسخ الاحتياطي للاسترداد.`)
};

/**
* | output |
* | --- |
* | "Download this file and store it somewhere safe. You'll need it along with your backup password to recover." |
*
* @param {Recovery_Setup_Backup_Readydesc1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_setup_backup_readydesc1 = /** @type {((inputs?: Recovery_Setup_Backup_Readydesc1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setup_Backup_Readydesc1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setup_backup_readydesc1(inputs)
	if (locale === "es") return es_recovery_setup_backup_readydesc1(inputs)
	if (locale === "fr") return fr_recovery_setup_backup_readydesc1(inputs)
	return ar_recovery_setup_backup_readydesc1(inputs)
});
export { recovery_setup_backup_readydesc1 as "recovery.setup.backup.readyDesc" }