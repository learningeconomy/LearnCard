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

const de_recovery_action_downloadagain1 = /** @type {(inputs: Recovery_Action_Downloadagain1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Erneut herunterladen`)
};

const ar_recovery_action_downloadagain1 = /** @type {(inputs: Recovery_Action_Downloadagain1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تنزيل مرة أخرى`)
};

const fr_recovery_action_downloadagain1 = /** @type {(inputs: Recovery_Action_Downloadagain1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Télécharger à nouveau`)
};

const ko_recovery_action_downloadagain1 = /** @type {(inputs: Recovery_Action_Downloadagain1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`다시 다운로드`)
};

/**
* | output |
* | --- |
* | "Download Again" |
*
* @param {Recovery_Action_Downloadagain1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const recovery_action_downloadagain1 = /** @type {((inputs?: Recovery_Action_Downloadagain1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Action_Downloadagain1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_action_downloadagain1(inputs)
	if (locale === "es") return es_recovery_action_downloadagain1(inputs)
	if (locale === "de") return de_recovery_action_downloadagain1(inputs)
	if (locale === "ar") return ar_recovery_action_downloadagain1(inputs)
	if (locale === "fr") return fr_recovery_action_downloadagain1(inputs)
	return ko_recovery_action_downloadagain1(inputs)
});
export { recovery_action_downloadagain1 as "recovery.action.downloadAgain" }