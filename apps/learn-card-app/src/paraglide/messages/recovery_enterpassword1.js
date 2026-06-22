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

const fr_recovery_enterpassword1 = /** @type {(inputs: Recovery_Enterpassword1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Veuillez saisir le mot de passe de votre fichier de sauvegarde.`)
};

const ar_recovery_enterpassword1 = /** @type {(inputs: Recovery_Enterpassword1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يرجى إدخال كلمة مرور ملف النسخ الاحتياطي.`)
};

/**
* | output |
* | --- |
* | "Please enter the password for your backup file." |
*
* @param {Recovery_Enterpassword1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_enterpassword1 = /** @type {((inputs?: Recovery_Enterpassword1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Enterpassword1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_enterpassword1(inputs)
	if (locale === "es") return es_recovery_enterpassword1(inputs)
	if (locale === "fr") return fr_recovery_enterpassword1(inputs)
	return ar_recovery_enterpassword1(inputs)
});
export { recovery_enterpassword1 as "recovery.enterPassword" }