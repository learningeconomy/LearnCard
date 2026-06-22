/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Action_ChangeInputs */

const en_recovery_action_change = /** @type {(inputs: Recovery_Action_ChangeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Change`)
};

const es_recovery_action_change = /** @type {(inputs: Recovery_Action_ChangeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cambiar`)
};

const fr_recovery_action_change = /** @type {(inputs: Recovery_Action_ChangeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modifier`)
};

const ar_recovery_action_change = /** @type {(inputs: Recovery_Action_ChangeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تغيير`)
};

/**
* | output |
* | --- |
* | "Change" |
*
* @param {Recovery_Action_ChangeInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_action_change = /** @type {((inputs?: Recovery_Action_ChangeInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Action_ChangeInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_action_change(inputs)
	if (locale === "es") return es_recovery_action_change(inputs)
	if (locale === "fr") return fr_recovery_action_change(inputs)
	return ar_recovery_action_change(inputs)
});
export { recovery_action_change as "recovery.action.change" }