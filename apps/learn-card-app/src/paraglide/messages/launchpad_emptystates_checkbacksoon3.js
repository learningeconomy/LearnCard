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

const fr_launchpad_emptystates_checkbacksoon3 = /** @type {(inputs: Launchpad_Emptystates_Checkbacksoon3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Revenez bientôt ou parcourez toutes les applications.`)
};

const ar_launchpad_emptystates_checkbacksoon3 = /** @type {(inputs: Launchpad_Emptystates_Checkbacksoon3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحقق قريباً أو تصفح جميع التطبيقات.`)
};

/**
* | output |
* | --- |
* | "Check back soon, or browse all apps." |
*
* @param {Launchpad_Emptystates_Checkbacksoon3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_emptystates_checkbacksoon3 = /** @type {((inputs?: Launchpad_Emptystates_Checkbacksoon3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Emptystates_Checkbacksoon3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_emptystates_checkbacksoon3(inputs)
	if (locale === "es") return es_launchpad_emptystates_checkbacksoon3(inputs)
	if (locale === "fr") return fr_launchpad_emptystates_checkbacksoon3(inputs)
	return ar_launchpad_emptystates_checkbacksoon3(inputs)
});
export { launchpad_emptystates_checkbacksoon3 as "launchpad.emptyStates.checkBackSoon" }