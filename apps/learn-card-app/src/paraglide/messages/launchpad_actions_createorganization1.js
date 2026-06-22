/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Actions_Createorganization1Inputs */

const en_launchpad_actions_createorganization1 = /** @type {(inputs: Launchpad_Actions_Createorganization1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create Organization`)
};

const es_launchpad_actions_createorganization1 = /** @type {(inputs: Launchpad_Actions_Createorganization1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crear organización`)
};

const fr_launchpad_actions_createorganization1 = /** @type {(inputs: Launchpad_Actions_Createorganization1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créer une organisation`)
};

const ar_launchpad_actions_createorganization1 = /** @type {(inputs: Launchpad_Actions_Createorganization1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء مؤسسة`)
};

/**
* | output |
* | --- |
* | "Create Organization" |
*
* @param {Launchpad_Actions_Createorganization1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_actions_createorganization1 = /** @type {((inputs?: Launchpad_Actions_Createorganization1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Actions_Createorganization1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_actions_createorganization1(inputs)
	if (locale === "es") return es_launchpad_actions_createorganization1(inputs)
	if (locale === "fr") return fr_launchpad_actions_createorganization1(inputs)
	return ar_launchpad_actions_createorganization1(inputs)
});
export { launchpad_actions_createorganization1 as "launchpad.actions.createOrganization" }