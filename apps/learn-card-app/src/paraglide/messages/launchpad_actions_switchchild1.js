/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Actions_Switchchild1Inputs */

const en_launchpad_actions_switchchild1 = /** @type {(inputs: Launchpad_Actions_Switchchild1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Switch Child`)
};

const es_launchpad_actions_switchchild1 = /** @type {(inputs: Launchpad_Actions_Switchchild1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cambiar niño`)
};

const fr_launchpad_actions_switchchild1 = /** @type {(inputs: Launchpad_Actions_Switchchild1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Changer d'enfant`)
};

const ar_launchpad_actions_switchchild1 = /** @type {(inputs: Launchpad_Actions_Switchchild1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تبديل الطفل`)
};

/**
* | output |
* | --- |
* | "Switch Child" |
*
* @param {Launchpad_Actions_Switchchild1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_actions_switchchild1 = /** @type {((inputs?: Launchpad_Actions_Switchchild1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Actions_Switchchild1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_actions_switchchild1(inputs)
	if (locale === "es") return es_launchpad_actions_switchchild1(inputs)
	if (locale === "fr") return fr_launchpad_actions_switchchild1(inputs)
	return ar_launchpad_actions_switchchild1(inputs)
});
export { launchpad_actions_switchchild1 as "launchpad.actions.switchChild" }