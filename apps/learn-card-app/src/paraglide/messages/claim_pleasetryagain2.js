/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claim_Pleasetryagain2Inputs */

const en_claim_pleasetryagain2 = /** @type {(inputs: Claim_Pleasetryagain2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Please try again.`)
};

const es_claim_pleasetryagain2 = /** @type {(inputs: Claim_Pleasetryagain2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Inténtalo de nuevo.`)
};

const fr_claim_pleasetryagain2 = /** @type {(inputs: Claim_Pleasetryagain2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Veuillez réessayer.`)
};

const ar_claim_pleasetryagain2 = /** @type {(inputs: Claim_Pleasetryagain2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يرجى المحاولة مرة أخرى.`)
};

/**
* | output |
* | --- |
* | "Please try again." |
*
* @param {Claim_Pleasetryagain2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_pleasetryagain2 = /** @type {((inputs?: Claim_Pleasetryagain2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_Pleasetryagain2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_pleasetryagain2(inputs)
	if (locale === "es") return es_claim_pleasetryagain2(inputs)
	if (locale === "fr") return fr_claim_pleasetryagain2(inputs)
	return ar_claim_pleasetryagain2(inputs)
});
export { claim_pleasetryagain2 as "claim.pleaseTryAgain" }