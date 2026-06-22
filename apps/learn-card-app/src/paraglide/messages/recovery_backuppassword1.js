/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Backuppassword1Inputs */

const en_recovery_backuppassword1 = /** @type {(inputs: Recovery_Backuppassword1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Backup Password`)
};

const es_recovery_backuppassword1 = /** @type {(inputs: Recovery_Backuppassword1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contraseña de copia de seguridad`)
};

const fr_recovery_backuppassword1 = /** @type {(inputs: Recovery_Backuppassword1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mot de passe de sauvegarde`)
};

const ar_recovery_backuppassword1 = /** @type {(inputs: Recovery_Backuppassword1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`كلمة مرور النسخة الاحتياطية`)
};

/**
* | output |
* | --- |
* | "Backup Password" |
*
* @param {Recovery_Backuppassword1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_backuppassword1 = /** @type {((inputs?: Recovery_Backuppassword1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Backuppassword1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_backuppassword1(inputs)
	if (locale === "es") return es_recovery_backuppassword1(inputs)
	if (locale === "fr") return fr_recovery_backuppassword1(inputs)
	return ar_recovery_backuppassword1(inputs)
});
export { recovery_backuppassword1 as "recovery.backupPassword" }