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

const de_launchpad_actions_createorganization1 = /** @type {(inputs: Launchpad_Actions_Createorganization1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Organisation erstellen`)
};

const ar_launchpad_actions_createorganization1 = /** @type {(inputs: Launchpad_Actions_Createorganization1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء مؤسسة`)
};

const fr_launchpad_actions_createorganization1 = /** @type {(inputs: Launchpad_Actions_Createorganization1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créer une organisation`)
};

const ko_launchpad_actions_createorganization1 = /** @type {(inputs: Launchpad_Actions_Createorganization1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`조직 만들기`)
};

/**
* | output |
* | --- |
* | "Create Organization" |
*
* @param {Launchpad_Actions_Createorganization1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const launchpad_actions_createorganization1 = /** @type {((inputs?: Launchpad_Actions_Createorganization1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Actions_Createorganization1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_actions_createorganization1(inputs)
	if (locale === "es") return es_launchpad_actions_createorganization1(inputs)
	if (locale === "de") return de_launchpad_actions_createorganization1(inputs)
	if (locale === "ar") return ar_launchpad_actions_createorganization1(inputs)
	if (locale === "fr") return fr_launchpad_actions_createorganization1(inputs)
	return ko_launchpad_actions_createorganization1(inputs)
});
export { launchpad_actions_createorganization1 as "launchpad.actions.createOrganization" }