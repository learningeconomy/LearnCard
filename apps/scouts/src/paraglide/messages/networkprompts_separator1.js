/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Networkprompts_Separator1Inputs */

const en_networkprompts_separator1 = /** @type {(inputs: Networkprompts_Separator1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`•`)
};

const es_networkprompts_separator1 = /** @type {(inputs: Networkprompts_Separator1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`•`)
};

const fr_networkprompts_separator1 = /** @type {(inputs: Networkprompts_Separator1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`•`)
};

const ar_networkprompts_separator1 = /** @type {(inputs: Networkprompts_Separator1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`•`)
};

/**
* | output |
* | --- |
* | "•" |
*
* @param {Networkprompts_Separator1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const networkprompts_separator1 = /** @type {((inputs?: Networkprompts_Separator1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Networkprompts_Separator1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_networkprompts_separator1(inputs)
	if (locale === "es") return es_networkprompts_separator1(inputs)
	if (locale === "fr") return fr_networkprompts_separator1(inputs)
	return ar_networkprompts_separator1(inputs)
});
export { networkprompts_separator1 as "networkPrompts.separator" }