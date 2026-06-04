/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Emptystates_Checkbacksoon3Inputs */

const en_launchpad_emptystates_checkbacksoon3 = /** @type {(inputs: Launchpad_Emptystates_Checkbacksoon3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Check back soon, or browse all apps.`)
};

const es_launchpad_emptystates_checkbacksoon3 = /** @type {(inputs: Launchpad_Emptystates_Checkbacksoon3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vuelve pronto o explora todas las aplicaciones.`)
};

const de_launchpad_emptystates_checkbacksoon3 = /** @type {(inputs: Launchpad_Emptystates_Checkbacksoon3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Schau bald wieder vorbei oder durchsuche alle Apps.`)
};

const ar_launchpad_emptystates_checkbacksoon3 = /** @type {(inputs: Launchpad_Emptystates_Checkbacksoon3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحقق قريباً أو تصفح جميع التطبيقات.`)
};

const fr_launchpad_emptystates_checkbacksoon3 = /** @type {(inputs: Launchpad_Emptystates_Checkbacksoon3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Revenez bientôt ou parcourez toutes les applications.`)
};

const ko_launchpad_emptystates_checkbacksoon3 = /** @type {(inputs: Launchpad_Emptystates_Checkbacksoon3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`곧 다시 확인하거나 모든 앱을 탐색하세요.`)
};

/**
* | output |
* | --- |
* | "Check back soon, or browse all apps." |
*
* @param {Launchpad_Emptystates_Checkbacksoon3Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const launchpad_emptystates_checkbacksoon3 = /** @type {((inputs?: Launchpad_Emptystates_Checkbacksoon3Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Emptystates_Checkbacksoon3Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_emptystates_checkbacksoon3(inputs)
	if (locale === "es") return es_launchpad_emptystates_checkbacksoon3(inputs)
	if (locale === "de") return de_launchpad_emptystates_checkbacksoon3(inputs)
	if (locale === "ar") return ar_launchpad_emptystates_checkbacksoon3(inputs)
	if (locale === "fr") return fr_launchpad_emptystates_checkbacksoon3(inputs)
	return ko_launchpad_emptystates_checkbacksoon3(inputs)
});
export { launchpad_emptystates_checkbacksoon3 as "launchpad.emptyStates.checkBackSoon" }