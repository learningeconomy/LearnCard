/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claim_ByInputs */

const en_claim_by = /** @type {(inputs: Claim_ByInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`by`)
};

const es_claim_by = /** @type {(inputs: Claim_ByInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`por`)
};

const fr_claim_by = /** @type {(inputs: Claim_ByInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`par`)
};

const ar_claim_by = /** @type {(inputs: Claim_ByInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بواسطة`)
};

/**
* | output |
* | --- |
* | "by" |
*
* @param {Claim_ByInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_by = /** @type {((inputs?: Claim_ByInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_ByInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_by(inputs)
	if (locale === "es") return es_claim_by(inputs)
	if (locale === "fr") return fr_claim_by(inputs)
	return ar_claim_by(inputs)
});
export { claim_by as "claim.by" }