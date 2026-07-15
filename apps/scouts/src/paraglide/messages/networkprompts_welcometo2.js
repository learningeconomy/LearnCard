/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Networkprompts_Welcometo2Inputs */

const en_networkprompts_welcometo2 = /** @type {(inputs: Networkprompts_Welcometo2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Welcome to`)
};

const es_networkprompts_welcometo2 = /** @type {(inputs: Networkprompts_Welcometo2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bienvenido a`)
};

const fr_networkprompts_welcometo2 = /** @type {(inputs: Networkprompts_Welcometo2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bienvenue sur`)
};

const ar_networkprompts_welcometo2 = /** @type {(inputs: Networkprompts_Welcometo2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Welcome to`)
};

/**
* | output |
* | --- |
* | "Welcome to" |
*
* @param {Networkprompts_Welcometo2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const networkprompts_welcometo2 = /** @type {((inputs?: Networkprompts_Welcometo2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Networkprompts_Welcometo2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_networkprompts_welcometo2(inputs)
	if (locale === "es") return es_networkprompts_welcometo2(inputs)
	if (locale === "fr") return fr_networkprompts_welcometo2(inputs)
	return ar_networkprompts_welcometo2(inputs)
});
export { networkprompts_welcometo2 as "networkPrompts.welcomeTo" }