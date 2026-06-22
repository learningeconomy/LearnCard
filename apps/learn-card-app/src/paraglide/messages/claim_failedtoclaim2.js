/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ message: NonNullable<unknown> }} Claim_Failedtoclaim2Inputs */

const en_claim_failedtoclaim2 = /** @type {(inputs: Claim_Failedtoclaim2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Failed to claim credential: ${i?.message}`)
};

const es_claim_failedtoclaim2 = /** @type {(inputs: Claim_Failedtoclaim2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`No se pudo reclamar la credencial: ${i?.message}`)
};

const fr_claim_failedtoclaim2 = /** @type {(inputs: Claim_Failedtoclaim2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Échec de la réclamation du justificatif : ${i?.message}`)
};

const ar_claim_failedtoclaim2 = /** @type {(inputs: Claim_Failedtoclaim2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`تعذّرت المطالبة ببيانات الاعتماد: ${i?.message}`)
};

/**
* | output |
* | --- |
* | "Failed to claim credential: {message}" |
*
* @param {Claim_Failedtoclaim2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_failedtoclaim2 = /** @type {((inputs: Claim_Failedtoclaim2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_Failedtoclaim2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_failedtoclaim2(inputs)
	if (locale === "es") return es_claim_failedtoclaim2(inputs)
	if (locale === "fr") return fr_claim_failedtoclaim2(inputs)
	return ar_claim_failedtoclaim2(inputs)
});
export { claim_failedtoclaim2 as "claim.failedToClaim" }