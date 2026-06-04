/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Action_Setuppasskey2Inputs */

const en_recovery_action_setuppasskey2 = /** @type {(inputs: Recovery_Action_Setuppasskey2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Set Up Passkey`)
};

const es_recovery_action_setuppasskey2 = /** @type {(inputs: Recovery_Action_Setuppasskey2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configurar clave de acceso`)
};

const de_recovery_action_setuppasskey2 = /** @type {(inputs: Recovery_Action_Setuppasskey2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Passkey einrichten`)
};

const ar_recovery_action_setuppasskey2 = /** @type {(inputs: Recovery_Action_Setuppasskey2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إعداد مفتاح المرور`)
};

const fr_recovery_action_setuppasskey2 = /** @type {(inputs: Recovery_Action_Setuppasskey2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configurer la clé d'accès`)
};

const ko_recovery_action_setuppasskey2 = /** @type {(inputs: Recovery_Action_Setuppasskey2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`패스키 설정`)
};

/**
* | output |
* | --- |
* | "Set Up Passkey" |
*
* @param {Recovery_Action_Setuppasskey2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const recovery_action_setuppasskey2 = /** @type {((inputs?: Recovery_Action_Setuppasskey2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Action_Setuppasskey2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_action_setuppasskey2(inputs)
	if (locale === "es") return es_recovery_action_setuppasskey2(inputs)
	if (locale === "de") return de_recovery_action_setuppasskey2(inputs)
	if (locale === "ar") return ar_recovery_action_setuppasskey2(inputs)
	if (locale === "fr") return fr_recovery_action_setuppasskey2(inputs)
	return ko_recovery_action_setuppasskey2(inputs)
});
export { recovery_action_setuppasskey2 as "recovery.action.setUpPasskey" }