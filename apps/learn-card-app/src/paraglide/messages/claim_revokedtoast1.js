/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claim_Revokedtoast1Inputs */

const en_claim_revokedtoast1 = /** @type {(inputs: Claim_Revokedtoast1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This credential has been revoked and can no longer be claimed.`)
};

const es_claim_revokedtoast1 = /** @type {(inputs: Claim_Revokedtoast1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Esta credencial ha sido revocada y ya no puede reclamarse.`)
};

const fr_claim_revokedtoast1 = /** @type {(inputs: Claim_Revokedtoast1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ce justificatif a été révoqué et ne peut plus être réclamé.`)
};

const ar_claim_revokedtoast1 = /** @type {(inputs: Claim_Revokedtoast1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم إبطال بيانات الاعتماد هذه ولم يعد بالإمكان المطالبة بها.`)
};

/**
* | output |
* | --- |
* | "This credential has been revoked and can no longer be claimed." |
*
* @param {Claim_Revokedtoast1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_revokedtoast1 = /** @type {((inputs?: Claim_Revokedtoast1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_Revokedtoast1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_revokedtoast1(inputs)
	if (locale === "es") return es_claim_revokedtoast1(inputs)
	if (locale === "fr") return fr_claim_revokedtoast1(inputs)
	return ar_claim_revokedtoast1(inputs)
});
export { claim_revokedtoast1 as "claim.revokedToast" }