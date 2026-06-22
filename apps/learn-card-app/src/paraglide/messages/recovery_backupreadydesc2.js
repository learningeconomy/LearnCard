/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Backupreadydesc2Inputs */

const en_recovery_backupreadydesc2 = /** @type {(inputs: Recovery_Backupreadydesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Download this file and store it somewhere safe. You'll need it along with your backup password to recover.`)
};

const es_recovery_backupreadydesc2 = /** @type {(inputs: Recovery_Backupreadydesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Descarga este archivo y guárdalo en un lugar seguro. Lo necesitarás junto con tu contraseña de copia de seguridad para recuperar.`)
};

const fr_recovery_backupreadydesc2 = /** @type {(inputs: Recovery_Backupreadydesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Téléchargez ce fichier et stockez-le en lieu sûr. Vous en aurez besoin avec votre mot de passe de sauvegarde pour récupérer.`)
};

const ar_recovery_backupreadydesc2 = /** @type {(inputs: Recovery_Backupreadydesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قم بتنزيل هذا الملف واحفظه في مكان آمن. ستحتاجه مع كلمة مرور النسخة الاحتياطية للاسترداد.`)
};

/**
* | output |
* | --- |
* | "Download this file and store it somewhere safe. You'll need it along with your backup password to recover." |
*
* @param {Recovery_Backupreadydesc2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_backupreadydesc2 = /** @type {((inputs?: Recovery_Backupreadydesc2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Backupreadydesc2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_backupreadydesc2(inputs)
	if (locale === "es") return es_recovery_backupreadydesc2(inputs)
	if (locale === "fr") return fr_recovery_backupreadydesc2(inputs)
	return ar_recovery_backupreadydesc2(inputs)
});
export { recovery_backupreadydesc2 as "recovery.backupReadyDesc" }