/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Action_Settingup1Inputs */

const en_recovery_action_settingup1 = /** @type {(inputs: Recovery_Action_Settingup1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Setting up...`)
};

const es_recovery_action_settingup1 = /** @type {(inputs: Recovery_Action_Settingup1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configurando...`)
};

const de_recovery_action_settingup1 = /** @type {(inputs: Recovery_Action_Settingup1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Wird eingerichtet...`)
};

const ar_recovery_action_settingup1 = /** @type {(inputs: Recovery_Action_Settingup1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري الإعداد...`)
};

const fr_recovery_action_settingup1 = /** @type {(inputs: Recovery_Action_Settingup1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configuration...`)
};

const ko_recovery_action_settingup1 = /** @type {(inputs: Recovery_Action_Settingup1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`설정 중...`)
};

/**
* | output |
* | --- |
* | "Setting up..." |
*
* @param {Recovery_Action_Settingup1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const recovery_action_settingup1 = /** @type {((inputs?: Recovery_Action_Settingup1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Action_Settingup1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_action_settingup1(inputs)
	if (locale === "es") return es_recovery_action_settingup1(inputs)
	if (locale === "de") return de_recovery_action_settingup1(inputs)
	if (locale === "ar") return ar_recovery_action_settingup1(inputs)
	if (locale === "fr") return fr_recovery_action_settingup1(inputs)
	return ko_recovery_action_settingup1(inputs)
});
export { recovery_action_settingup1 as "recovery.action.settingUp" }