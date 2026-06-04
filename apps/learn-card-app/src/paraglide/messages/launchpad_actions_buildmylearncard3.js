/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Actions_Buildmylearncard3Inputs */

const en_launchpad_actions_buildmylearncard3 = /** @type {(inputs: Launchpad_Actions_Buildmylearncard3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Build My LearnCard`)
};

const es_launchpad_actions_buildmylearncard3 = /** @type {(inputs: Launchpad_Actions_Buildmylearncard3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Construir Mi LearnCard`)
};

const de_launchpad_actions_buildmylearncard3 = /** @type {(inputs: Launchpad_Actions_Buildmylearncard3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mein LearnCard aufbauen`)
};

const ar_launchpad_actions_buildmylearncard3 = /** @type {(inputs: Launchpad_Actions_Buildmylearncard3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بناء LearnCard الخاص بي`)
};

const fr_launchpad_actions_buildmylearncard3 = /** @type {(inputs: Launchpad_Actions_Buildmylearncard3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Construire Mon LearnCard`)
};

const ko_launchpad_actions_buildmylearncard3 = /** @type {(inputs: Launchpad_Actions_Buildmylearncard3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`나의 LearnCard 만들기`)
};

/**
* | output |
* | --- |
* | "Build My LearnCard" |
*
* @param {Launchpad_Actions_Buildmylearncard3Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const launchpad_actions_buildmylearncard3 = /** @type {((inputs?: Launchpad_Actions_Buildmylearncard3Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Actions_Buildmylearncard3Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_actions_buildmylearncard3(inputs)
	if (locale === "es") return es_launchpad_actions_buildmylearncard3(inputs)
	if (locale === "de") return de_launchpad_actions_buildmylearncard3(inputs)
	if (locale === "ar") return ar_launchpad_actions_buildmylearncard3(inputs)
	if (locale === "fr") return fr_launchpad_actions_buildmylearncard3(inputs)
	return ko_launchpad_actions_buildmylearncard3(inputs)
});
export { launchpad_actions_buildmylearncard3 as "launchpad.actions.buildMyLearnCard" }