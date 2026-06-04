/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Savebackupfile2Inputs */

const en_recovery_savebackupfile2 = /** @type {(inputs: Recovery_Savebackupfile2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Save your backup file`)
};

const es_recovery_savebackupfile2 = /** @type {(inputs: Recovery_Savebackupfile2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guarda tu archivo de respaldo`)
};

const de_recovery_savebackupfile2 = /** @type {(inputs: Recovery_Savebackupfile2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Speichere deine Sicherungsdatei`)
};

const ar_recovery_savebackupfile2 = /** @type {(inputs: Recovery_Savebackupfile2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`احفظ ملف النسخ الاحتياطي`)
};

const fr_recovery_savebackupfile2 = /** @type {(inputs: Recovery_Savebackupfile2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sauvegardez votre fichier de sauvegarde`)
};

const ko_recovery_savebackupfile2 = /** @type {(inputs: Recovery_Savebackupfile2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`백업 파일 저장`)
};

/**
* | output |
* | --- |
* | "Save your backup file" |
*
* @param {Recovery_Savebackupfile2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const recovery_savebackupfile2 = /** @type {((inputs?: Recovery_Savebackupfile2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Savebackupfile2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_savebackupfile2(inputs)
	if (locale === "es") return es_recovery_savebackupfile2(inputs)
	if (locale === "de") return de_recovery_savebackupfile2(inputs)
	if (locale === "ar") return ar_recovery_savebackupfile2(inputs)
	if (locale === "fr") return fr_recovery_savebackupfile2(inputs)
	return ko_recovery_savebackupfile2(inputs)
});
export { recovery_savebackupfile2 as "recovery.saveBackupFile" }