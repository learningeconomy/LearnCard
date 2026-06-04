/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Action_Generatephrase1Inputs */

const en_recovery_action_generatephrase1 = /** @type {(inputs: Recovery_Action_Generatephrase1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generate Recovery Phrase`)
};

const es_recovery_action_generatephrase1 = /** @type {(inputs: Recovery_Action_Generatephrase1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generar frase de recuperación`)
};

const de_recovery_action_generatephrase1 = /** @type {(inputs: Recovery_Action_Generatephrase1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Wiederherstellungsphrase generieren`)
};

const ar_recovery_action_generatephrase1 = /** @type {(inputs: Recovery_Action_Generatephrase1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء عبارة استعادة`)
};

const fr_recovery_action_generatephrase1 = /** @type {(inputs: Recovery_Action_Generatephrase1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Générer une phrase de récupération`)
};

const ko_recovery_action_generatephrase1 = /** @type {(inputs: Recovery_Action_Generatephrase1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`복구 구문 생성`)
};

/**
* | output |
* | --- |
* | "Generate Recovery Phrase" |
*
* @param {Recovery_Action_Generatephrase1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const recovery_action_generatephrase1 = /** @type {((inputs?: Recovery_Action_Generatephrase1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Action_Generatephrase1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_action_generatephrase1(inputs)
	if (locale === "es") return es_recovery_action_generatephrase1(inputs)
	if (locale === "de") return de_recovery_action_generatephrase1(inputs)
	if (locale === "ar") return ar_recovery_action_generatephrase1(inputs)
	if (locale === "fr") return fr_recovery_action_generatephrase1(inputs)
	return ko_recovery_action_generatephrase1(inputs)
});
export { recovery_action_generatephrase1 as "recovery.action.generatePhrase" }