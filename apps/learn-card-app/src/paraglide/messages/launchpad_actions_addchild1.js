/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Actions_Addchild1Inputs */

const en_launchpad_actions_addchild1 = /** @type {(inputs: Launchpad_Actions_Addchild1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add Child`)
};

const es_launchpad_actions_addchild1 = /** @type {(inputs: Launchpad_Actions_Addchild1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Agregar niño`)
};

const fr_launchpad_actions_addchild1 = /** @type {(inputs: Launchpad_Actions_Addchild1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter un enfant`)
};

const ar_launchpad_actions_addchild1 = /** @type {(inputs: Launchpad_Actions_Addchild1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إضافة طفل`)
};

/**
* | output |
* | --- |
* | "Add Child" |
*
* @param {Launchpad_Actions_Addchild1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_actions_addchild1 = /** @type {((inputs?: Launchpad_Actions_Addchild1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Actions_Addchild1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_actions_addchild1(inputs)
	if (locale === "es") return es_launchpad_actions_addchild1(inputs)
	if (locale === "fr") return fr_launchpad_actions_addchild1(inputs)
	return ar_launchpad_actions_addchild1(inputs)
});
export { launchpad_actions_addchild1 as "launchpad.actions.addChild" }