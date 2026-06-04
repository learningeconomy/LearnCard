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

const de_recovery_selectbackupfile2 = /** @type {(inputs: Recovery_Selectbackupfile2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bitte wähle deine Sicherungsdatei aus.`)
};

const ar_recovery_selectbackupfile2 = /** @type {(inputs: Recovery_Selectbackupfile2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يرجى اختيار ملف النسخ الاحتياطي.`)
};

const fr_recovery_selectbackupfile2 = /** @type {(inputs: Recovery_Selectbackupfile2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Veuillez sélectionner votre fichier de sauvegarde.`)
};

const ko_recovery_selectbackupfile2 = /** @type {(inputs: Recovery_Selectbackupfile2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`백업 파일을 선택하세요.`)
};

/**
* | output |
* | --- |
* | "Please select your backup file." |
*
* @param {Recovery_Selectbackupfile2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const recovery_selectbackupfile2 = /** @type {((inputs?: Recovery_Selectbackupfile2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Selectbackupfile2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_selectbackupfile2(inputs)
	if (locale === "es") return es_recovery_selectbackupfile2(inputs)
	if (locale === "de") return de_recovery_selectbackupfile2(inputs)
	if (locale === "ar") return ar_recovery_selectbackupfile2(inputs)
	if (locale === "fr") return fr_recovery_selectbackupfile2(inputs)
	return ko_recovery_selectbackupfile2(inputs)
});
export { recovery_selectbackupfile2 as "recovery.selectBackupFile" }