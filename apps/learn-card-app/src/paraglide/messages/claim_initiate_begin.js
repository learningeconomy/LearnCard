/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claim_Initiate_BeginInputs */

const en_claim_initiate_begin = /** @type {(inputs: Claim_Initiate_BeginInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Begin`)
};

const es_claim_initiate_begin = /** @type {(inputs: Claim_Initiate_BeginInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Comenzar`)
};

const fr_claim_initiate_begin = /** @type {(inputs: Claim_Initiate_BeginInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Commencer`)
};

const ar_claim_initiate_begin = /** @type {(inputs: Claim_Initiate_BeginInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ابدأ`)
};

/**
* | output |
* | --- |
* | "Begin" |
*
* @param {Claim_Initiate_BeginInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_initiate_begin = /** @type {((inputs?: Claim_Initiate_BeginInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_Initiate_BeginInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_initiate_begin(inputs)
	if (locale === "es") return es_claim_initiate_begin(inputs)
	if (locale === "fr") return fr_claim_initiate_begin(inputs)
	return ar_claim_initiate_begin(inputs)
});
export { claim_initiate_begin as "claim.initiate.begin" }