/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Selectbackupfile2Inputs */

const en_recovery_selectbackupfile2 = /** @type {(inputs: Recovery_Selectbackupfile2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Please select your backup file.`)
};

const es_recovery_selectbackupfile2 = /** @type {(inputs: Recovery_Selectbackupfile2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Selecciona tu archivo de respaldo.`)
};

const fr_recovery_selectbackupfile2 = /** @type {(inputs: Recovery_Selectbackupfile2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Veuillez sélectionner votre fichier de sauvegarde.`)
};

const ar_recovery_selectbackupfile2 = /** @type {(inputs: Recovery_Selectbackupfile2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يرجى اختيار ملف النسخ الاحتياطي.`)
};

/**
* | output |
* | --- |
* | "Please select your backup file." |
*
* @param {Recovery_Selectbackupfile2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_selectbackupfile2 = /** @type {((inputs?: Recovery_Selectbackupfile2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Selectbackupfile2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_selectbackupfile2(inputs)
	if (locale === "es") return es_recovery_selectbackupfile2(inputs)
	if (locale === "fr") return fr_recovery_selectbackupfile2(inputs)
	return ar_recovery_selectbackupfile2(inputs)
});
export { recovery_selectbackupfile2 as "recovery.selectBackupFile" }