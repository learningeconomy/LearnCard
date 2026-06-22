/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claim_Modal_Maybelater1Inputs */

const en_claim_modal_maybelater1 = /** @type {(inputs: Claim_Modal_Maybelater1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Maybe Later`)
};

const es_claim_modal_maybelater1 = /** @type {(inputs: Claim_Modal_Maybelater1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Quizás más tarde`)
};

const fr_claim_modal_maybelater1 = /** @type {(inputs: Claim_Modal_Maybelater1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Plus tard`)
};

const ar_claim_modal_maybelater1 = /** @type {(inputs: Claim_Modal_Maybelater1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ربما لاحقًا`)
};

/**
* | output |
* | --- |
* | "Maybe Later" |
*
* @param {Claim_Modal_Maybelater1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_modal_maybelater1 = /** @type {((inputs?: Claim_Modal_Maybelater1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_Modal_Maybelater1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_modal_maybelater1(inputs)
	if (locale === "es") return es_claim_modal_maybelater1(inputs)
	if (locale === "fr") return fr_claim_modal_maybelater1(inputs)
	return ar_claim_modal_maybelater1(inputs)
});
export { claim_modal_maybelater1 as "claim.modal.maybeLater" }