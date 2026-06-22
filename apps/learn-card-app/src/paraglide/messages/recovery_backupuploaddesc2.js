/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Backupuploaddesc2Inputs */

const en_recovery_backupuploaddesc2 = /** @type {(inputs: Recovery_Backupuploaddesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Upload your backup file and enter the password you used when creating it.`)
};

const es_recovery_backupuploaddesc2 = /** @type {(inputs: Recovery_Backupuploaddesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sube tu archivo de copia de seguridad e ingresa la contraseña que usaste al crearlo.`)
};

const fr_recovery_backupuploaddesc2 = /** @type {(inputs: Recovery_Backupuploaddesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Téléversez votre fichier de sauvegarde et entrez le mot de passe utilisé lors de sa création.`)
};

const ar_recovery_backupuploaddesc2 = /** @type {(inputs: Recovery_Backupuploaddesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قم بتحميل ملف النسخة الاحتياطية وأدخل كلمة المرور التي استخدمتها عند إنشائه.`)
};

/**
* | output |
* | --- |
* | "Upload your backup file and enter the password you used when creating it." |
*
* @param {Recovery_Backupuploaddesc2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_backupuploaddesc2 = /** @type {((inputs?: Recovery_Backupuploaddesc2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Backupuploaddesc2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_backupuploaddesc2(inputs)
	if (locale === "es") return es_recovery_backupuploaddesc2(inputs)
	if (locale === "fr") return fr_recovery_backupuploaddesc2(inputs)
	return ar_recovery_backupuploaddesc2(inputs)
});
export { recovery_backupuploaddesc2 as "recovery.backupUploadDesc" }