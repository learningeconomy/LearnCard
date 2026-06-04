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

const de_launchpad_modal_whatwouldyouliketodo5 = /** @type {(inputs: Launchpad_Modal_Whatwouldyouliketodo5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Was möchtest du tun?`)
};

const ar_launchpad_modal_whatwouldyouliketodo5 = /** @type {(inputs: Launchpad_Modal_Whatwouldyouliketodo5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ماذا تريد أن تفعل؟`)
};

const fr_launchpad_modal_whatwouldyouliketodo5 = /** @type {(inputs: Launchpad_Modal_Whatwouldyouliketodo5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Que souhaitez-vous faire ?`)
};

const ko_launchpad_modal_whatwouldyouliketodo5 = /** @type {(inputs: Launchpad_Modal_Whatwouldyouliketodo5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`무엇을 하시겠습니까?`)
};

/**
* | output |
* | --- |
* | "What would you like to do?" |
*
* @param {Launchpad_Modal_Whatwouldyouliketodo5Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const launchpad_modal_whatwouldyouliketodo5 = /** @type {((inputs?: Launchpad_Modal_Whatwouldyouliketodo5Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Modal_Whatwouldyouliketodo5Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_modal_whatwouldyouliketodo5(inputs)
	if (locale === "es") return es_launchpad_modal_whatwouldyouliketodo5(inputs)
	if (locale === "de") return de_launchpad_modal_whatwouldyouliketodo5(inputs)
	if (locale === "ar") return ar_launchpad_modal_whatwouldyouliketodo5(inputs)
	if (locale === "fr") return fr_launchpad_modal_whatwouldyouliketodo5(inputs)
	return ko_launchpad_modal_whatwouldyouliketodo5(inputs)
});
export { launchpad_modal_whatwouldyouliketodo5 as "launchpad.modal.whatWouldYouLikeToDo" }