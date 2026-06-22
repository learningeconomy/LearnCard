/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Actions_Switchaccount1Inputs */

const en_launchpad_actions_switchaccount1 = /** @type {(inputs: Launchpad_Actions_Switchaccount1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Switch Account`)
};

const es_launchpad_actions_switchaccount1 = /** @type {(inputs: Launchpad_Actions_Switchaccount1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cambiar cuenta`)
};

const fr_launchpad_actions_switchaccount1 = /** @type {(inputs: Launchpad_Actions_Switchaccount1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Changer de compte`)
};

const ar_launchpad_actions_switchaccount1 = /** @type {(inputs: Launchpad_Actions_Switchaccount1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تبديل الحساب`)
};

/**
* | output |
* | --- |
* | "Switch Account" |
*
* @param {Launchpad_Actions_Switchaccount1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_actions_switchaccount1 = /** @type {((inputs?: Launchpad_Actions_Switchaccount1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Actions_Switchaccount1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_actions_switchaccount1(inputs)
	if (locale === "es") return es_launchpad_actions_switchaccount1(inputs)
	if (locale === "fr") return fr_launchpad_actions_switchaccount1(inputs)
	return ar_launchpad_actions_switchaccount1(inputs)
});
export { launchpad_actions_switchaccount1 as "launchpad.actions.switchAccount" }