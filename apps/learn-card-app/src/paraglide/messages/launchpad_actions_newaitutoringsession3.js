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

const de_launchpad_actions_newaitutoringsession3 = /** @type {(inputs: Launchpad_Actions_Newaitutoringsession3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Neue KI-Tutoring-Sitzung`)
};

const ar_launchpad_actions_newaitutoringsession3 = /** @type {(inputs: Launchpad_Actions_Newaitutoringsession3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جلسة تعليم ذكاء اصطناعي جديدة`)
};

const fr_launchpad_actions_newaitutoringsession3 = /** @type {(inputs: Launchpad_Actions_Newaitutoringsession3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nouvelle session de tutorat IA`)
};

const ko_launchpad_actions_newaitutoringsession3 = /** @type {(inputs: Launchpad_Actions_Newaitutoringsession3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`새 AI 튜터링 세션`)
};

/**
* | output |
* | --- |
* | "New AI Tutoring Session" |
*
* @param {Launchpad_Actions_Newaitutoringsession3Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const launchpad_actions_newaitutoringsession3 = /** @type {((inputs?: Launchpad_Actions_Newaitutoringsession3Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Actions_Newaitutoringsession3Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_actions_newaitutoringsession3(inputs)
	if (locale === "es") return es_launchpad_actions_newaitutoringsession3(inputs)
	if (locale === "de") return de_launchpad_actions_newaitutoringsession3(inputs)
	if (locale === "ar") return ar_launchpad_actions_newaitutoringsession3(inputs)
	if (locale === "fr") return fr_launchpad_actions_newaitutoringsession3(inputs)
	return ko_launchpad_actions_newaitutoringsession3(inputs)
});
export { launchpad_actions_newaitutoringsession3 as "launchpad.actions.newAiTutoringSession" }