/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Backup_Passlabel1Inputs */

const en_recovery_backup_passlabel1 = /** @type {(inputs: Recovery_Backup_Passlabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Backup Password`)
};

const es_recovery_backup_passlabel1 = /** @type {(inputs: Recovery_Backup_Passlabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contraseña de Respaldo`)
};

const fr_recovery_backup_passlabel1 = /** @type {(inputs: Recovery_Backup_Passlabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mot de passe de la sauvegarde`)
};

const ar_recovery_backup_passlabel1 = /** @type {(inputs: Recovery_Backup_Passlabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Backup Password`)
};

/**
* | output |
* | --- |
* | "Backup Password" |
*
* @param {Recovery_Backup_Passlabel1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_backup_passlabel1 = /** @type {((inputs?: Recovery_Backup_Passlabel1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Backup_Passlabel1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_backup_passlabel1(inputs)
	if (locale === "es") return es_recovery_backup_passlabel1(inputs)
	if (locale === "fr") return fr_recovery_backup_passlabel1(inputs)
	return ar_recovery_backup_passlabel1(inputs)
});
export { recovery_backup_passlabel1 as "recovery.backup.passLabel" }