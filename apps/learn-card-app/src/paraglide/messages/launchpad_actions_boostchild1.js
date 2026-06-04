/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Actions_Boostchild1Inputs */

const en_launchpad_actions_boostchild1 = /** @type {(inputs: Launchpad_Actions_Boostchild1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boost Child`)
};

const es_launchpad_actions_boostchild1 = /** @type {(inputs: Launchpad_Actions_Boostchild1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impulsar a niño`)
};

const de_launchpad_actions_boostchild1 = /** @type {(inputs: Launchpad_Actions_Boostchild1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Kind fördern`)
};

const ar_launchpad_actions_boostchild1 = /** @type {(inputs: Launchpad_Actions_Boostchild1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعزيز الطفل`)
};

const fr_launchpad_actions_boostchild1 = /** @type {(inputs: Launchpad_Actions_Boostchild1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Valoriser l'enfant`)
};

const ko_launchpad_actions_boostchild1 = /** @type {(inputs: Launchpad_Actions_Boostchild1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`자녀 부스트`)
};

/**
* | output |
* | --- |
* | "Boost Child" |
*
* @param {Launchpad_Actions_Boostchild1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const launchpad_actions_boostchild1 = /** @type {((inputs?: Launchpad_Actions_Boostchild1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Actions_Boostchild1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_actions_boostchild1(inputs)
	if (locale === "es") return es_launchpad_actions_boostchild1(inputs)
	if (locale === "de") return de_launchpad_actions_boostchild1(inputs)
	if (locale === "ar") return ar_launchpad_actions_boostchild1(inputs)
	if (locale === "fr") return fr_launchpad_actions_boostchild1(inputs)
	return ko_launchpad_actions_boostchild1(inputs)
});
export { launchpad_actions_boostchild1 as "launchpad.actions.boostChild" }