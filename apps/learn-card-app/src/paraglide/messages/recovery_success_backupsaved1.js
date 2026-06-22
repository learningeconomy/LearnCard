/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Success_Backupsaved1Inputs */

const en_recovery_success_backupsaved1 = /** @type {(inputs: Recovery_Success_Backupsaved1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Backup file saved! Keep it and your password somewhere safe.`)
};

const es_recovery_success_backupsaved1 = /** @type {(inputs: Recovery_Success_Backupsaved1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Archivo de copia de seguridad guardado! Guárdalo junto con tu contraseña en un lugar seguro.`)
};

const fr_recovery_success_backupsaved1 = /** @type {(inputs: Recovery_Success_Backupsaved1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fichier de sauvegarde enregistré ! Gardez-le ainsi que votre mot de passe en lieu sûr.`)
};

const ar_recovery_success_backupsaved1 = /** @type {(inputs: Recovery_Success_Backupsaved1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم حفظ ملف النسخة الاحتياطية! احفظه وكلمة المرور الخاصة بك في مكان آمن.`)
};

/**
* | output |
* | --- |
* | "Backup file saved! Keep it and your password somewhere safe." |
*
* @param {Recovery_Success_Backupsaved1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_success_backupsaved1 = /** @type {((inputs?: Recovery_Success_Backupsaved1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Success_Backupsaved1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_success_backupsaved1(inputs)
	if (locale === "es") return es_recovery_success_backupsaved1(inputs)
	if (locale === "fr") return fr_recovery_success_backupsaved1(inputs)
	return ar_recovery_success_backupsaved1(inputs)
});
export { recovery_success_backupsaved1 as "recovery.success.backupSaved" }