/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Action_EnterInputs */

const en_recovery_action_enter = /** @type {(inputs: Recovery_Action_EnterInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enter`)
};

const es_recovery_action_enter = /** @type {(inputs: Recovery_Action_EnterInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ingresar`)
};

const de_recovery_action_enter = /** @type {(inputs: Recovery_Action_EnterInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Eingeben`)
};

const ar_recovery_action_enter = /** @type {(inputs: Recovery_Action_EnterInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إدخال`)
};

const fr_recovery_action_enter = /** @type {(inputs: Recovery_Action_EnterInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Saisir`)
};

const ko_recovery_action_enter = /** @type {(inputs: Recovery_Action_EnterInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`입력`)
};

/**
* | output |
* | --- |
* | "Enter" |
*
* @param {Recovery_Action_EnterInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const recovery_action_enter = /** @type {((inputs?: Recovery_Action_EnterInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Action_EnterInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_action_enter(inputs)
	if (locale === "es") return es_recovery_action_enter(inputs)
	if (locale === "de") return de_recovery_action_enter(inputs)
	if (locale === "ar") return ar_recovery_action_enter(inputs)
	if (locale === "fr") return fr_recovery_action_enter(inputs)
	return ko_recovery_action_enter(inputs)
});
export { recovery_action_enter as "recovery.action.enter" }