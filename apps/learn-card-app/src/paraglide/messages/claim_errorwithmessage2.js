/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ message: NonNullable<unknown> }} Claim_Errorwithmessage2Inputs */

const en_claim_errorwithmessage2 = /** @type {(inputs: Claim_Errorwithmessage2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`There was an error: ${i?.message}`)
};

const es_claim_errorwithmessage2 = /** @type {(inputs: Claim_Errorwithmessage2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Ocurrió un error: ${i?.message}`)
};

const fr_claim_errorwithmessage2 = /** @type {(inputs: Claim_Errorwithmessage2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Une erreur s'est produite : ${i?.message}`)
};

const ar_claim_errorwithmessage2 = /** @type {(inputs: Claim_Errorwithmessage2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`حدث خطأ: ${i?.message}`)
};

/**
* | output |
* | --- |
* | "There was an error: {message}" |
*
* @param {Claim_Errorwithmessage2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_errorwithmessage2 = /** @type {((inputs: Claim_Errorwithmessage2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_Errorwithmessage2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_errorwithmessage2(inputs)
	if (locale === "es") return es_claim_errorwithmessage2(inputs)
	if (locale === "fr") return fr_claim_errorwithmessage2(inputs)
	return ar_claim_errorwithmessage2(inputs)
});
export { claim_errorwithmessage2 as "claim.errorWithMessage" }