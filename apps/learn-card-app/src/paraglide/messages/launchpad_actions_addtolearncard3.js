/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Actions_Addtolearncard3Inputs */

const en_launchpad_actions_addtolearncard3 = /** @type {(inputs: Launchpad_Actions_Addtolearncard3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add to LearnCard`)
};

const es_launchpad_actions_addtolearncard3 = /** @type {(inputs: Launchpad_Actions_Addtolearncard3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Agregar a LearnCard`)
};

const de_launchpad_actions_addtolearncard3 = /** @type {(inputs: Launchpad_Actions_Addtolearncard3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Zu LearnCard hinzufügen`)
};

const ar_launchpad_actions_addtolearncard3 = /** @type {(inputs: Launchpad_Actions_Addtolearncard3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إضافة إلى LearnCard`)
};

const fr_launchpad_actions_addtolearncard3 = /** @type {(inputs: Launchpad_Actions_Addtolearncard3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter à LearnCard`)
};

const ko_launchpad_actions_addtolearncard3 = /** @type {(inputs: Launchpad_Actions_Addtolearncard3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`LearnCard에 추가`)
};

/**
* | output |
* | --- |
* | "Add to LearnCard" |
*
* @param {Launchpad_Actions_Addtolearncard3Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const launchpad_actions_addtolearncard3 = /** @type {((inputs?: Launchpad_Actions_Addtolearncard3Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Actions_Addtolearncard3Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_actions_addtolearncard3(inputs)
	if (locale === "es") return es_launchpad_actions_addtolearncard3(inputs)
	if (locale === "de") return de_launchpad_actions_addtolearncard3(inputs)
	if (locale === "ar") return ar_launchpad_actions_addtolearncard3(inputs)
	if (locale === "fr") return fr_launchpad_actions_addtolearncard3(inputs)
	return ko_launchpad_actions_addtolearncard3(inputs)
});
export { launchpad_actions_addtolearncard3 as "launchpad.actions.addToLearnCard" }