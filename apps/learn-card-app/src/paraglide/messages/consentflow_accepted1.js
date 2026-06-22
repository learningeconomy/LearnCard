/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Accepted1Inputs */

const en_consentflow_accepted1 = /** @type {(inputs: Consentflow_Accepted1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accepted`)
};

const es_consentflow_accepted1 = /** @type {(inputs: Consentflow_Accepted1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aceptado`)
};

const fr_consentflow_accepted1 = /** @type {(inputs: Consentflow_Accepted1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accepté`)
};

const ar_consentflow_accepted1 = /** @type {(inputs: Consentflow_Accepted1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مقبول`)
};

/**
* | output |
* | --- |
* | "Accepted" |
*
* @param {Consentflow_Accepted1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_accepted1 = /** @type {((inputs?: Consentflow_Accepted1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Accepted1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_accepted1(inputs)
	if (locale === "es") return es_consentflow_accepted1(inputs)
	if (locale === "fr") return fr_consentflow_accepted1(inputs)
	return ar_consentflow_accepted1(inputs)
});
export { consentflow_accepted1 as "consentFlow.accepted" }