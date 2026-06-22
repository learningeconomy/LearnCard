/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Newfamily2Inputs */

const en_consentflow_newfamily2 = /** @type {(inputs: Consentflow_Newfamily2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`New Family`)
};

const es_consentflow_newfamily2 = /** @type {(inputs: Consentflow_Newfamily2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nueva familia`)
};

const fr_consentflow_newfamily2 = /** @type {(inputs: Consentflow_Newfamily2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nouvelle famille`)
};

const ar_consentflow_newfamily2 = /** @type {(inputs: Consentflow_Newfamily2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عائلة جديدة`)
};

/**
* | output |
* | --- |
* | "New Family" |
*
* @param {Consentflow_Newfamily2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_newfamily2 = /** @type {((inputs?: Consentflow_Newfamily2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Newfamily2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_newfamily2(inputs)
	if (locale === "es") return es_consentflow_newfamily2(inputs)
	if (locale === "fr") return fr_consentflow_newfamily2(inputs)
	return ar_consentflow_newfamily2(inputs)
});
export { consentflow_newfamily2 as "consentFlow.newFamily" }