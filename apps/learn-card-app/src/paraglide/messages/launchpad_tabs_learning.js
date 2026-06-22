/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Tabs_LearningInputs */

const en_launchpad_tabs_learning = /** @type {(inputs: Launchpad_Tabs_LearningInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Learning`)
};

const es_launchpad_tabs_learning = /** @type {(inputs: Launchpad_Tabs_LearningInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aprendizaje`)
};

const fr_launchpad_tabs_learning = /** @type {(inputs: Launchpad_Tabs_LearningInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Apprentissage`)
};

const ar_launchpad_tabs_learning = /** @type {(inputs: Launchpad_Tabs_LearningInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التعلم`)
};

/**
* | output |
* | --- |
* | "Learning" |
*
* @param {Launchpad_Tabs_LearningInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_tabs_learning = /** @type {((inputs?: Launchpad_Tabs_LearningInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Tabs_LearningInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_tabs_learning(inputs)
	if (locale === "es") return es_launchpad_tabs_learning(inputs)
	if (locale === "fr") return fr_launchpad_tabs_learning(inputs)
	return ar_launchpad_tabs_learning(inputs)
});
export { launchpad_tabs_learning as "launchpad.tabs.learning" }