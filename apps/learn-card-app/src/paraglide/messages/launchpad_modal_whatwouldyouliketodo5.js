/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Modal_Whatwouldyouliketodo5Inputs */

const en_launchpad_modal_whatwouldyouliketodo5 = /** @type {(inputs: Launchpad_Modal_Whatwouldyouliketodo5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`What would you like to do?`)
};

const es_launchpad_modal_whatwouldyouliketodo5 = /** @type {(inputs: Launchpad_Modal_Whatwouldyouliketodo5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Qué te gustaría hacer?`)
};

const fr_launchpad_modal_whatwouldyouliketodo5 = /** @type {(inputs: Launchpad_Modal_Whatwouldyouliketodo5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Que souhaitez-vous faire ?`)
};

const ar_launchpad_modal_whatwouldyouliketodo5 = /** @type {(inputs: Launchpad_Modal_Whatwouldyouliketodo5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ماذا تريد أن تفعل؟`)
};

/**
* | output |
* | --- |
* | "What would you like to do?" |
*
* @param {Launchpad_Modal_Whatwouldyouliketodo5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_modal_whatwouldyouliketodo5 = /** @type {((inputs?: Launchpad_Modal_Whatwouldyouliketodo5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Modal_Whatwouldyouliketodo5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_modal_whatwouldyouliketodo5(inputs)
	if (locale === "es") return es_launchpad_modal_whatwouldyouliketodo5(inputs)
	if (locale === "fr") return fr_launchpad_modal_whatwouldyouliketodo5(inputs)
	return ar_launchpad_modal_whatwouldyouliketodo5(inputs)
});
export { launchpad_modal_whatwouldyouliketodo5 as "launchpad.modal.whatWouldYouLikeToDo" }