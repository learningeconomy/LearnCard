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

const de_recovery_action_generatenewbackup2 = /** @type {(inputs: Recovery_Action_Generatenewbackup2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Neue Sicherung generieren`)
};

const ar_recovery_action_generatenewbackup2 = /** @type {(inputs: Recovery_Action_Generatenewbackup2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء نسخة احتياطية جديدة`)
};

const fr_recovery_action_generatenewbackup2 = /** @type {(inputs: Recovery_Action_Generatenewbackup2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Générer une nouvelle sauvegarde`)
};

const ko_recovery_action_generatenewbackup2 = /** @type {(inputs: Recovery_Action_Generatenewbackup2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`새 백업 생성`)
};

/**
* | output |
* | --- |
* | "Generate New Backup" |
*
* @param {Recovery_Action_Generatenewbackup2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const recovery_action_generatenewbackup2 = /** @type {((inputs?: Recovery_Action_Generatenewbackup2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Action_Generatenewbackup2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_action_generatenewbackup2(inputs)
	if (locale === "es") return es_recovery_action_generatenewbackup2(inputs)
	if (locale === "de") return de_recovery_action_generatenewbackup2(inputs)
	if (locale === "ar") return ar_recovery_action_generatenewbackup2(inputs)
	if (locale === "fr") return fr_recovery_action_generatenewbackup2(inputs)
	return ko_recovery_action_generatenewbackup2(inputs)
});
export { recovery_action_generatenewbackup2 as "recovery.action.generateNewBackup" }