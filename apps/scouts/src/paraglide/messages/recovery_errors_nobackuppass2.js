/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Errors_Nobackuppass2Inputs */

const en_recovery_errors_nobackuppass2 = /** @type {(inputs: Recovery_Errors_Nobackuppass2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Please enter the password for your backup file.`)
};

const es_recovery_errors_nobackuppass2 = /** @type {(inputs: Recovery_Errors_Nobackuppass2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Por favor ingresa la contraseña de tu archivo de respaldo.`)
};

const fr_recovery_errors_nobackuppass2 = /** @type {(inputs: Recovery_Errors_Nobackuppass2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Veuillez saisir le mot de passe de votre fichier de sauvegarde.`)
};

const ar_recovery_errors_nobackuppass2 = /** @type {(inputs: Recovery_Errors_Nobackuppass2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Please enter the password for your backup file.`)
};

/**
* | output |
* | --- |
* | "Please enter the password for your backup file." |
*
* @param {Recovery_Errors_Nobackuppass2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_errors_nobackuppass2 = /** @type {((inputs?: Recovery_Errors_Nobackuppass2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Errors_Nobackuppass2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_errors_nobackuppass2(inputs)
	if (locale === "es") return es_recovery_errors_nobackuppass2(inputs)
	if (locale === "fr") return fr_recovery_errors_nobackuppass2(inputs)
	return ar_recovery_errors_nobackuppass2(inputs)
});
export { recovery_errors_nobackuppass2 as "recovery.errors.noBackupPass" }