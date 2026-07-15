/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Errors_Nobackupfile2Inputs */

const en_recovery_errors_nobackupfile2 = /** @type {(inputs: Recovery_Errors_Nobackupfile2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Please select your backup file.`)
};

const es_recovery_errors_nobackupfile2 = /** @type {(inputs: Recovery_Errors_Nobackupfile2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Por favor selecciona tu archivo de respaldo.`)
};

const fr_recovery_errors_nobackupfile2 = /** @type {(inputs: Recovery_Errors_Nobackupfile2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Veuillez sélectionner votre fichier de sauvegarde.`)
};

const ar_recovery_errors_nobackupfile2 = /** @type {(inputs: Recovery_Errors_Nobackupfile2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Please select your backup file.`)
};

/**
* | output |
* | --- |
* | "Please select your backup file." |
*
* @param {Recovery_Errors_Nobackupfile2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_errors_nobackupfile2 = /** @type {((inputs?: Recovery_Errors_Nobackupfile2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Errors_Nobackupfile2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_errors_nobackupfile2(inputs)
	if (locale === "es") return es_recovery_errors_nobackupfile2(inputs)
	if (locale === "fr") return fr_recovery_errors_nobackupfile2(inputs)
	return ar_recovery_errors_nobackupfile2(inputs)
});
export { recovery_errors_nobackupfile2 as "recovery.errors.noBackupFile" }