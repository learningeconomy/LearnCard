/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Action_Replacepasskey1Inputs */

const en_recovery_action_replacepasskey1 = /** @type {(inputs: Recovery_Action_Replacepasskey1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Replace Passkey`)
};

const es_recovery_action_replacepasskey1 = /** @type {(inputs: Recovery_Action_Replacepasskey1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Reemplazar clave de acceso`)
};

const fr_recovery_action_replacepasskey1 = /** @type {(inputs: Recovery_Action_Replacepasskey1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Remplacer la clé d'accès`)
};

const ar_recovery_action_replacepasskey1 = /** @type {(inputs: Recovery_Action_Replacepasskey1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استبدال مفتاح المرور`)
};

/**
* | output |
* | --- |
* | "Replace Passkey" |
*
* @param {Recovery_Action_Replacepasskey1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_action_replacepasskey1 = /** @type {((inputs?: Recovery_Action_Replacepasskey1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Action_Replacepasskey1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_action_replacepasskey1(inputs)
	if (locale === "es") return es_recovery_action_replacepasskey1(inputs)
	if (locale === "fr") return fr_recovery_action_replacepasskey1(inputs)
	return ar_recovery_action_replacepasskey1(inputs)
});
export { recovery_action_replacepasskey1 as "recovery.action.replacePasskey" }