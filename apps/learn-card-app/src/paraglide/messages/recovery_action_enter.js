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

const fr_recovery_action_enter = /** @type {(inputs: Recovery_Action_EnterInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Saisir`)
};

const ar_recovery_action_enter = /** @type {(inputs: Recovery_Action_EnterInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إدخال`)
};

/**
* | output |
* | --- |
* | "Enter" |
*
* @param {Recovery_Action_EnterInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_action_enter = /** @type {((inputs?: Recovery_Action_EnterInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Action_EnterInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_action_enter(inputs)
	if (locale === "es") return es_recovery_action_enter(inputs)
	if (locale === "fr") return fr_recovery_action_enter(inputs)
	return ar_recovery_action_enter(inputs)
});
export { recovery_action_enter as "recovery.action.enter" }