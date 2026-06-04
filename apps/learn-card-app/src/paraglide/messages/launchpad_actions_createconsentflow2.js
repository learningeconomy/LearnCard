/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Actions_Createconsentflow2Inputs */

const en_launchpad_actions_createconsentflow2 = /** @type {(inputs: Launchpad_Actions_Createconsentflow2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create ConsentFlow`)
};

const es_launchpad_actions_createconsentflow2 = /** @type {(inputs: Launchpad_Actions_Createconsentflow2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crear ConsentFlow`)
};

const de_launchpad_actions_createconsentflow2 = /** @type {(inputs: Launchpad_Actions_Createconsentflow2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ConsentFlow erstellen`)
};

const ar_launchpad_actions_createconsentflow2 = /** @type {(inputs: Launchpad_Actions_Createconsentflow2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء ConsentFlow`)
};

const fr_launchpad_actions_createconsentflow2 = /** @type {(inputs: Launchpad_Actions_Createconsentflow2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créer un ConsentFlow`)
};

const ko_launchpad_actions_createconsentflow2 = /** @type {(inputs: Launchpad_Actions_Createconsentflow2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ConsentFlow 만들기`)
};

/**
* | output |
* | --- |
* | "Create ConsentFlow" |
*
* @param {Launchpad_Actions_Createconsentflow2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const launchpad_actions_createconsentflow2 = /** @type {((inputs?: Launchpad_Actions_Createconsentflow2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Actions_Createconsentflow2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_actions_createconsentflow2(inputs)
	if (locale === "es") return es_launchpad_actions_createconsentflow2(inputs)
	if (locale === "de") return de_launchpad_actions_createconsentflow2(inputs)
	if (locale === "ar") return ar_launchpad_actions_createconsentflow2(inputs)
	if (locale === "fr") return fr_launchpad_actions_createconsentflow2(inputs)
	return ko_launchpad_actions_createconsentflow2(inputs)
});
export { launchpad_actions_createconsentflow2 as "launchpad.actions.createConsentFlow" }