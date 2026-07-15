/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Networkprompts_Usernameplh2Inputs */

const en_networkprompts_usernameplh2 = /** @type {(inputs: Networkprompts_Usernameplh2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`username`)
};

const es_networkprompts_usernameplh2 = /** @type {(inputs: Networkprompts_Usernameplh2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`nombre de usuario`)
};

const fr_networkprompts_usernameplh2 = /** @type {(inputs: Networkprompts_Usernameplh2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`nom d'utilisateur`)
};

const ar_networkprompts_usernameplh2 = /** @type {(inputs: Networkprompts_Usernameplh2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`username`)
};

/**
* | output |
* | --- |
* | "username" |
*
* @param {Networkprompts_Usernameplh2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const networkprompts_usernameplh2 = /** @type {((inputs?: Networkprompts_Usernameplh2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Networkprompts_Usernameplh2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_networkprompts_usernameplh2(inputs)
	if (locale === "es") return es_networkprompts_usernameplh2(inputs)
	if (locale === "fr") return fr_networkprompts_usernameplh2(inputs)
	return ar_networkprompts_usernameplh2(inputs)
});
export { networkprompts_usernameplh2 as "networkPrompts.usernamePlh" }