/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Enterpassword1Inputs */

const en_recovery_enterpassword1 = /** @type {(inputs: Recovery_Enterpassword1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Please enter the password for your backup file.`)
};

const es_recovery_enterpassword1 = /** @type {(inputs: Recovery_Enterpassword1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Introduce la contraseña de tu archivo de respaldo.`)
};

const de_recovery_enterpassword1 = /** @type {(inputs: Recovery_Enterpassword1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bitte gib das Passwort für deine Sicherungsdatei ein.`)
};

const ar_recovery_enterpassword1 = /** @type {(inputs: Recovery_Enterpassword1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يرجى إدخال كلمة مرور ملف النسخ الاحتياطي.`)
};

const fr_recovery_enterpassword1 = /** @type {(inputs: Recovery_Enterpassword1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Veuillez saisir le mot de passe de votre fichier de sauvegarde.`)
};

const ko_recovery_enterpassword1 = /** @type {(inputs: Recovery_Enterpassword1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`백업 파일의 비밀번호를 입력하세요.`)
};

/**
* | output |
* | --- |
* | "Please enter the password for your backup file." |
*
* @param {Recovery_Enterpassword1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const recovery_enterpassword1 = /** @type {((inputs?: Recovery_Enterpassword1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Enterpassword1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_enterpassword1(inputs)
	if (locale === "es") return es_recovery_enterpassword1(inputs)
	if (locale === "de") return de_recovery_enterpassword1(inputs)
	if (locale === "ar") return ar_recovery_enterpassword1(inputs)
	if (locale === "fr") return fr_recovery_enterpassword1(inputs)
	return ko_recovery_enterpassword1(inputs)
});
export { recovery_enterpassword1 as "recovery.enterPassword" }