/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Actions_Understandmyskills2Inputs */

const en_launchpad_actions_understandmyskills2 = /** @type {(inputs: Launchpad_Actions_Understandmyskills2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Understand My Skills`)
};

const es_launchpad_actions_understandmyskills2 = /** @type {(inputs: Launchpad_Actions_Understandmyskills2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Entender mis habilidades`)
};

const de_launchpad_actions_understandmyskills2 = /** @type {(inputs: Launchpad_Actions_Understandmyskills2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Meine Fähigkeiten verstehen`)
};

const ar_launchpad_actions_understandmyskills2 = /** @type {(inputs: Launchpad_Actions_Understandmyskills2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فهم مهاراتي`)
};

const fr_launchpad_actions_understandmyskills2 = /** @type {(inputs: Launchpad_Actions_Understandmyskills2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Comprendre mes compétences`)
};

const ko_launchpad_actions_understandmyskills2 = /** @type {(inputs: Launchpad_Actions_Understandmyskills2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`내 기술 이해하기`)
};

/**
* | output |
* | --- |
* | "Understand My Skills" |
*
* @param {Launchpad_Actions_Understandmyskills2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const launchpad_actions_understandmyskills2 = /** @type {((inputs?: Launchpad_Actions_Understandmyskills2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Actions_Understandmyskills2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_actions_understandmyskills2(inputs)
	if (locale === "es") return es_launchpad_actions_understandmyskills2(inputs)
	if (locale === "de") return de_launchpad_actions_understandmyskills2(inputs)
	if (locale === "ar") return ar_launchpad_actions_understandmyskills2(inputs)
	if (locale === "fr") return fr_launchpad_actions_understandmyskills2(inputs)
	return ko_launchpad_actions_understandmyskills2(inputs)
});
export { launchpad_actions_understandmyskills2 as "launchpad.actions.understandMySkills" }