/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Emptystates_Checkbacksoon3Inputs */

const en_launchpad_emptystates_checkbacksoon3 = /** @type {(inputs: Launchpad_Emptystates_Checkbacksoon3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Check back soon, or browse all apps.`)
};

const es_launchpad_emptystates_checkbacksoon3 = /** @type {(inputs: Launchpad_Emptystates_Checkbacksoon3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vuelve pronto, o explora todas las apps.`)
};

const de_launchpad_emptystates_checkbacksoon3 = /** @type {(inputs: Launchpad_Emptystates_Checkbacksoon3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Komm bald wieder vorbei oder durchstöbere alle Apps.`)
};

const ar_launchpad_emptystates_checkbacksoon3 = /** @type {(inputs: Launchpad_Emptystates_Checkbacksoon3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عد قريباً، أو تصفح جميع التطبيقات.`)
};

/**
* | output |
* | --- |
* | "Check back soon, or browse all apps." |
*
* @param {Launchpad_Emptystates_Checkbacksoon3Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_emptystates_checkbacksoon3 = /** @type {((inputs?: Launchpad_Emptystates_Checkbacksoon3Inputs, options?: { locale?: "en" | "es" | "de" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Emptystates_Checkbacksoon3Inputs, { locale?: "en" | "es" | "de" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_emptystates_checkbacksoon3(inputs)
	if (locale === "es") return es_launchpad_emptystates_checkbacksoon3(inputs)
	if (locale === "de") return de_launchpad_emptystates_checkbacksoon3(inputs)
	return ar_launchpad_emptystates_checkbacksoon3(inputs)
});
export { launchpad_emptystates_checkbacksoon3 as "launchpad.emptyStates.checkBackSoon" }