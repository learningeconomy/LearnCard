/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Backup_Passplaceholder1Inputs */

const en_recovery_backup_passplaceholder1 = /** @type {(inputs: Recovery_Backup_Passplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Password used when creating backup`)
};

const es_recovery_backup_passplaceholder1 = /** @type {(inputs: Recovery_Backup_Passplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contraseña usada al crear el respaldo`)
};

const fr_recovery_backup_passplaceholder1 = /** @type {(inputs: Recovery_Backup_Passplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mot de passe utilisé lors de la création de la sauvegarde`)
};

const ar_recovery_backup_passplaceholder1 = /** @type {(inputs: Recovery_Backup_Passplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Password used when creating backup`)
};

/**
* | output |
* | --- |
* | "Password used when creating backup" |
*
* @param {Recovery_Backup_Passplaceholder1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_backup_passplaceholder1 = /** @type {((inputs?: Recovery_Backup_Passplaceholder1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Backup_Passplaceholder1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_backup_passplaceholder1(inputs)
	if (locale === "es") return es_recovery_backup_passplaceholder1(inputs)
	if (locale === "fr") return fr_recovery_backup_passplaceholder1(inputs)
	return ar_recovery_backup_passplaceholder1(inputs)
});
export { recovery_backup_passplaceholder1 as "recovery.backup.passPlaceholder" }