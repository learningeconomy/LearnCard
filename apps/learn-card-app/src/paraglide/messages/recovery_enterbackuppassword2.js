/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Enterbackuppassword2Inputs */

const en_recovery_enterbackuppassword2 = /** @type {(inputs: Recovery_Enterbackuppassword2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Please enter the password for your backup file.`)
};

const es_recovery_enterbackuppassword2 = /** @type {(inputs: Recovery_Enterbackuppassword2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Por favor ingresa la contraseña de tu archivo de copia de seguridad.`)
};

const fr_recovery_enterbackuppassword2 = /** @type {(inputs: Recovery_Enterbackuppassword2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Veuillez entrer le mot de passe de votre fichier de sauvegarde.`)
};

const ar_recovery_enterbackuppassword2 = /** @type {(inputs: Recovery_Enterbackuppassword2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يرجى إدخال كلمة مرور ملف النسخة الاحتياطية.`)
};

/**
* | output |
* | --- |
* | "Please enter the password for your backup file." |
*
* @param {Recovery_Enterbackuppassword2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_enterbackuppassword2 = /** @type {((inputs?: Recovery_Enterbackuppassword2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Enterbackuppassword2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_enterbackuppassword2(inputs)
	if (locale === "es") return es_recovery_enterbackuppassword2(inputs)
	if (locale === "fr") return fr_recovery_enterbackuppassword2(inputs)
	return ar_recovery_enterbackuppassword2(inputs)
});
export { recovery_enterbackuppassword2 as "recovery.enterBackupPassword" }