/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Action_Generatenewbackup2Inputs */

const en_recovery_action_generatenewbackup2 = /** @type {(inputs: Recovery_Action_Generatenewbackup2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generate New Backup`)
};

const es_recovery_action_generatenewbackup2 = /** @type {(inputs: Recovery_Action_Generatenewbackup2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generar nuevo respaldo`)
};

const fr_recovery_action_generatenewbackup2 = /** @type {(inputs: Recovery_Action_Generatenewbackup2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Générer une nouvelle sauvegarde`)
};

const ar_recovery_action_generatenewbackup2 = /** @type {(inputs: Recovery_Action_Generatenewbackup2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء نسخة احتياطية جديدة`)
};

/**
* | output |
* | --- |
* | "Generate New Backup" |
*
* @param {Recovery_Action_Generatenewbackup2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_action_generatenewbackup2 = /** @type {((inputs?: Recovery_Action_Generatenewbackup2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Action_Generatenewbackup2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_action_generatenewbackup2(inputs)
	if (locale === "es") return es_recovery_action_generatenewbackup2(inputs)
	if (locale === "fr") return fr_recovery_action_generatenewbackup2(inputs)
	return ar_recovery_action_generatenewbackup2(inputs)
});
export { recovery_action_generatenewbackup2 as "recovery.action.generateNewBackup" }