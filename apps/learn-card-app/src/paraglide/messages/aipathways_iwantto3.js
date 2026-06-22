/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aipathways_Iwantto3Inputs */

const en_aipathways_iwantto3 = /** @type {(inputs: Aipathways_Iwantto3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`I want to...`)
};

const es_aipathways_iwantto3 = /** @type {(inputs: Aipathways_Iwantto3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Quiero...`)
};

const fr_aipathways_iwantto3 = /** @type {(inputs: Aipathways_Iwantto3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Je veux...`)
};

const ar_aipathways_iwantto3 = /** @type {(inputs: Aipathways_Iwantto3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`...أريد`)
};

/**
* | output |
* | --- |
* | "I want to..." |
*
* @param {Aipathways_Iwantto3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aipathways_iwantto3 = /** @type {((inputs?: Aipathways_Iwantto3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aipathways_Iwantto3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aipathways_iwantto3(inputs)
	if (locale === "es") return es_aipathways_iwantto3(inputs)
	if (locale === "fr") return fr_aipathways_iwantto3(inputs)
	return ar_aipathways_iwantto3(inputs)
});
export { aipathways_iwantto3 as "aiPathways.iWantTo" }