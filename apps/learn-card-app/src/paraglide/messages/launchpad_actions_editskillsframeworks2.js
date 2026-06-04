/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Actions_Editskillsframeworks2Inputs */

const en_launchpad_actions_editskillsframeworks2 = /** @type {(inputs: Launchpad_Actions_Editskillsframeworks2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Edit Skills Frameworks`)
};

const es_launchpad_actions_editskillsframeworks2 = /** @type {(inputs: Launchpad_Actions_Editskillsframeworks2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Editar marcos de habilidades`)
};

const de_launchpad_actions_editskillsframeworks2 = /** @type {(inputs: Launchpad_Actions_Editskillsframeworks2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fähigkeitsrahmen bearbeiten`)
};

const ar_launchpad_actions_editskillsframeworks2 = /** @type {(inputs: Launchpad_Actions_Editskillsframeworks2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعديل أطر المهارات`)
};

const fr_launchpad_actions_editskillsframeworks2 = /** @type {(inputs: Launchpad_Actions_Editskillsframeworks2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modifier les cadres de compétences`)
};

const ko_launchpad_actions_editskillsframeworks2 = /** @type {(inputs: Launchpad_Actions_Editskillsframeworks2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`기술 프레임워크 편집`)
};

/**
* | output |
* | --- |
* | "Edit Skills Frameworks" |
*
* @param {Launchpad_Actions_Editskillsframeworks2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const launchpad_actions_editskillsframeworks2 = /** @type {((inputs?: Launchpad_Actions_Editskillsframeworks2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Actions_Editskillsframeworks2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_actions_editskillsframeworks2(inputs)
	if (locale === "es") return es_launchpad_actions_editskillsframeworks2(inputs)
	if (locale === "de") return de_launchpad_actions_editskillsframeworks2(inputs)
	if (locale === "ar") return ar_launchpad_actions_editskillsframeworks2(inputs)
	if (locale === "fr") return fr_launchpad_actions_editskillsframeworks2(inputs)
	return ko_launchpad_actions_editskillsframeworks2(inputs)
});
export { launchpad_actions_editskillsframeworks2 as "launchpad.actions.editSkillsFrameworks" }