/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Actions_Newaitutoringsession3Inputs */

const en_launchpad_actions_newaitutoringsession3 = /** @type {(inputs: Launchpad_Actions_Newaitutoringsession3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`New AI Tutoring Session`)
};

const es_launchpad_actions_newaitutoringsession3 = /** @type {(inputs: Launchpad_Actions_Newaitutoringsession3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nueva sesión de tutoría IA`)
};

const fr_launchpad_actions_newaitutoringsession3 = /** @type {(inputs: Launchpad_Actions_Newaitutoringsession3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nouvelle session de tutorat IA`)
};

const ar_launchpad_actions_newaitutoringsession3 = /** @type {(inputs: Launchpad_Actions_Newaitutoringsession3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جلسة تعليم ذكاء اصطناعي جديدة`)
};

/**
* | output |
* | --- |
* | "New AI Tutoring Session" |
*
* @param {Launchpad_Actions_Newaitutoringsession3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_actions_newaitutoringsession3 = /** @type {((inputs?: Launchpad_Actions_Newaitutoringsession3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Actions_Newaitutoringsession3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_actions_newaitutoringsession3(inputs)
	if (locale === "es") return es_launchpad_actions_newaitutoringsession3(inputs)
	if (locale === "fr") return fr_launchpad_actions_newaitutoringsession3(inputs)
	return ar_launchpad_actions_newaitutoringsession3(inputs)
});
export { launchpad_actions_newaitutoringsession3 as "launchpad.actions.newAiTutoringSession" }