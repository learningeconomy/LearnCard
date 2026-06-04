/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Action_Fileselected1Inputs */

const en_recovery_action_fileselected1 = /** @type {(inputs: Recovery_Action_Fileselected1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`File selected`)
};

const es_recovery_action_fileselected1 = /** @type {(inputs: Recovery_Action_Fileselected1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Archivo seleccionado`)
};

const de_recovery_action_fileselected1 = /** @type {(inputs: Recovery_Action_Fileselected1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Datei ausgewählt`)
};

const ar_recovery_action_fileselected1 = /** @type {(inputs: Recovery_Action_Fileselected1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم اختيار الملف`)
};

const fr_recovery_action_fileselected1 = /** @type {(inputs: Recovery_Action_Fileselected1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fichier sélectionné`)
};

const ko_recovery_action_fileselected1 = /** @type {(inputs: Recovery_Action_Fileselected1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`파일 선택됨`)
};

/**
* | output |
* | --- |
* | "File selected" |
*
* @param {Recovery_Action_Fileselected1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const recovery_action_fileselected1 = /** @type {((inputs?: Recovery_Action_Fileselected1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Action_Fileselected1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_action_fileselected1(inputs)
	if (locale === "es") return es_recovery_action_fileselected1(inputs)
	if (locale === "de") return de_recovery_action_fileselected1(inputs)
	if (locale === "ar") return ar_recovery_action_fileselected1(inputs)
	if (locale === "fr") return fr_recovery_action_fileselected1(inputs)
	return ko_recovery_action_fileselected1(inputs)
});
export { recovery_action_fileselected1 as "recovery.action.fileSelected" }