/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Actions_Useclaimlink2Inputs */

const en_launchpad_actions_useclaimlink2 = /** @type {(inputs: Launchpad_Actions_Useclaimlink2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use a Claim Link`)
};

const es_launchpad_actions_useclaimlink2 = /** @type {(inputs: Launchpad_Actions_Useclaimlink2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Usar un enlace de reclamación`)
};

const fr_launchpad_actions_useclaimlink2 = /** @type {(inputs: Launchpad_Actions_Useclaimlink2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Utiliser un lien de réclamation`)
};

const ar_launchpad_actions_useclaimlink2 = /** @type {(inputs: Launchpad_Actions_Useclaimlink2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استخدم رابط مطالبة`)
};

/**
* | output |
* | --- |
* | "Use a Claim Link" |
*
* @param {Launchpad_Actions_Useclaimlink2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_actions_useclaimlink2 = /** @type {((inputs?: Launchpad_Actions_Useclaimlink2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Actions_Useclaimlink2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_actions_useclaimlink2(inputs)
	if (locale === "es") return es_launchpad_actions_useclaimlink2(inputs)
	if (locale === "fr") return fr_launchpad_actions_useclaimlink2(inputs)
	return ar_launchpad_actions_useclaimlink2(inputs)
});
export { launchpad_actions_useclaimlink2 as "launchpad.actions.useClaimLink" }