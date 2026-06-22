/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Action_Generatebackup1Inputs */

const en_recovery_action_generatebackup1 = /** @type {(inputs: Recovery_Action_Generatebackup1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generate Backup File`)
};

const es_recovery_action_generatebackup1 = /** @type {(inputs: Recovery_Action_Generatebackup1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generar archivo de respaldo`)
};

const fr_recovery_action_generatebackup1 = /** @type {(inputs: Recovery_Action_Generatebackup1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Générer un fichier de sauvegarde`)
};

const ar_recovery_action_generatebackup1 = /** @type {(inputs: Recovery_Action_Generatebackup1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء ملف نسخ احتياطي`)
};

/**
* | output |
* | --- |
* | "Generate Backup File" |
*
* @param {Recovery_Action_Generatebackup1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_action_generatebackup1 = /** @type {((inputs?: Recovery_Action_Generatebackup1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Action_Generatebackup1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_action_generatebackup1(inputs)
	if (locale === "es") return es_recovery_action_generatebackup1(inputs)
	if (locale === "fr") return fr_recovery_action_generatebackup1(inputs)
	return ar_recovery_action_generatebackup1(inputs)
});
export { recovery_action_generatebackup1 as "recovery.action.generateBackup" }