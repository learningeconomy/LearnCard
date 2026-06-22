/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Action_Generatenewphrase2Inputs */

const en_recovery_action_generatenewphrase2 = /** @type {(inputs: Recovery_Action_Generatenewphrase2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generate New Phrase`)
};

const es_recovery_action_generatenewphrase2 = /** @type {(inputs: Recovery_Action_Generatenewphrase2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generar nueva frase`)
};

const fr_recovery_action_generatenewphrase2 = /** @type {(inputs: Recovery_Action_Generatenewphrase2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Générer une nouvelle phrase`)
};

const ar_recovery_action_generatenewphrase2 = /** @type {(inputs: Recovery_Action_Generatenewphrase2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء عبارة جديدة`)
};

/**
* | output |
* | --- |
* | "Generate New Phrase" |
*
* @param {Recovery_Action_Generatenewphrase2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_action_generatenewphrase2 = /** @type {((inputs?: Recovery_Action_Generatenewphrase2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Action_Generatenewphrase2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_action_generatenewphrase2(inputs)
	if (locale === "es") return es_recovery_action_generatenewphrase2(inputs)
	if (locale === "fr") return fr_recovery_action_generatenewphrase2(inputs)
	return ar_recovery_action_generatenewphrase2(inputs)
});
export { recovery_action_generatenewphrase2 as "recovery.action.generateNewPhrase" }