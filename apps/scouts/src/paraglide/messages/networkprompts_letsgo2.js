/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Networkprompts_Letsgo2Inputs */

const en_networkprompts_letsgo2 = /** @type {(inputs: Networkprompts_Letsgo2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Let's Go!`)
};

const es_networkprompts_letsgo2 = /** @type {(inputs: Networkprompts_Letsgo2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Vamos!`)
};

const fr_networkprompts_letsgo2 = /** @type {(inputs: Networkprompts_Letsgo2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`C'est parti !`)
};

const ar_networkprompts_letsgo2 = /** @type {(inputs: Networkprompts_Letsgo2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Let's Go!`)
};

/**
* | output |
* | --- |
* | "Let's Go!" |
*
* @param {Networkprompts_Letsgo2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const networkprompts_letsgo2 = /** @type {((inputs?: Networkprompts_Letsgo2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Networkprompts_Letsgo2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_networkprompts_letsgo2(inputs)
	if (locale === "es") return es_networkprompts_letsgo2(inputs)
	if (locale === "fr") return fr_networkprompts_letsgo2(inputs)
	return ar_networkprompts_letsgo2(inputs)
});
export { networkprompts_letsgo2 as "networkPrompts.letsGo" }