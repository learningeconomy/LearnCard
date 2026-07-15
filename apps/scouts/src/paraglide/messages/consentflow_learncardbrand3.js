/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Learncardbrand3Inputs */

const en_consentflow_learncardbrand3 = /** @type {(inputs: Consentflow_Learncardbrand3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`LearnCard`)
};

const es_consentflow_learncardbrand3 = /** @type {(inputs: Consentflow_Learncardbrand3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`LearnCard`)
};

const fr_consentflow_learncardbrand3 = /** @type {(inputs: Consentflow_Learncardbrand3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`LearnCard`)
};

const ar_consentflow_learncardbrand3 = /** @type {(inputs: Consentflow_Learncardbrand3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`LearnCard`)
};

/**
* | output |
* | --- |
* | "LearnCard" |
*
* @param {Consentflow_Learncardbrand3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_learncardbrand3 = /** @type {((inputs?: Consentflow_Learncardbrand3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Learncardbrand3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_learncardbrand3(inputs)
	if (locale === "es") return es_consentflow_learncardbrand3(inputs)
	if (locale === "fr") return fr_consentflow_learncardbrand3(inputs)
	return ar_consentflow_learncardbrand3(inputs)
});
export { consentflow_learncardbrand3 as "consentFlow.learnCardBrand" }