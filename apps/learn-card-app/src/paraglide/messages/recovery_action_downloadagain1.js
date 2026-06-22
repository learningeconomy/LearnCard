/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Action_Downloadagain1Inputs */

const en_recovery_action_downloadagain1 = /** @type {(inputs: Recovery_Action_Downloadagain1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Download Again`)
};

const es_recovery_action_downloadagain1 = /** @type {(inputs: Recovery_Action_Downloadagain1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Descargar de nuevo`)
};

const fr_recovery_action_downloadagain1 = /** @type {(inputs: Recovery_Action_Downloadagain1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Télécharger à nouveau`)
};

const ar_recovery_action_downloadagain1 = /** @type {(inputs: Recovery_Action_Downloadagain1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تنزيل مرة أخرى`)
};

/**
* | output |
* | --- |
* | "Download Again" |
*
* @param {Recovery_Action_Downloadagain1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_action_downloadagain1 = /** @type {((inputs?: Recovery_Action_Downloadagain1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Action_Downloadagain1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_action_downloadagain1(inputs)
	if (locale === "es") return es_recovery_action_downloadagain1(inputs)
	if (locale === "fr") return fr_recovery_action_downloadagain1(inputs)
	return ar_recovery_action_downloadagain1(inputs)
});
export { recovery_action_downloadagain1 as "recovery.action.downloadAgain" }