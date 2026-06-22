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

const fr_launchpad_actions_addtolearncard3 = /** @type {(inputs: Launchpad_Actions_Addtolearncard3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter à LearnCard`)
};

const ar_launchpad_actions_addtolearncard3 = /** @type {(inputs: Launchpad_Actions_Addtolearncard3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إضافة إلى LearnCard`)
};

/**
* | output |
* | --- |
* | "Add to LearnCard" |
*
* @param {Launchpad_Actions_Addtolearncard3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_actions_addtolearncard3 = /** @type {((inputs?: Launchpad_Actions_Addtolearncard3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Actions_Addtolearncard3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_actions_addtolearncard3(inputs)
	if (locale === "es") return es_launchpad_actions_addtolearncard3(inputs)
	if (locale === "fr") return fr_launchpad_actions_addtolearncard3(inputs)
	return ar_launchpad_actions_addtolearncard3(inputs)
});
export { launchpad_actions_addtolearncard3 as "launchpad.actions.addToLearnCard" }