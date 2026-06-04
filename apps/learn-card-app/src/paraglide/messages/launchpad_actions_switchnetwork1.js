/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Actions_Switchnetwork1Inputs */

const en_launchpad_actions_switchnetwork1 = /** @type {(inputs: Launchpad_Actions_Switchnetwork1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Switch Network`)
};

const es_launchpad_actions_switchnetwork1 = /** @type {(inputs: Launchpad_Actions_Switchnetwork1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cambiar red`)
};

const de_launchpad_actions_switchnetwork1 = /** @type {(inputs: Launchpad_Actions_Switchnetwork1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Netzwerk wechseln`)
};

const ar_launchpad_actions_switchnetwork1 = /** @type {(inputs: Launchpad_Actions_Switchnetwork1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تبديل الشبكة`)
};

const fr_launchpad_actions_switchnetwork1 = /** @type {(inputs: Launchpad_Actions_Switchnetwork1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Changer de réseau`)
};

const ko_launchpad_actions_switchnetwork1 = /** @type {(inputs: Launchpad_Actions_Switchnetwork1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`네트워크 전환`)
};

/**
* | output |
* | --- |
* | "Switch Network" |
*
* @param {Launchpad_Actions_Switchnetwork1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const launchpad_actions_switchnetwork1 = /** @type {((inputs?: Launchpad_Actions_Switchnetwork1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Actions_Switchnetwork1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_actions_switchnetwork1(inputs)
	if (locale === "es") return es_launchpad_actions_switchnetwork1(inputs)
	if (locale === "de") return de_launchpad_actions_switchnetwork1(inputs)
	if (locale === "ar") return ar_launchpad_actions_switchnetwork1(inputs)
	if (locale === "fr") return fr_launchpad_actions_switchnetwork1(inputs)
	return ko_launchpad_actions_switchnetwork1(inputs)
});
export { launchpad_actions_switchnetwork1 as "launchpad.actions.switchNetwork" }