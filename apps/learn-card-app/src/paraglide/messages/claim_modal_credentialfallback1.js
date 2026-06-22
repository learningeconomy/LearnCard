/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claim_Modal_Credentialfallback1Inputs */

const en_claim_modal_credentialfallback1 = /** @type {(inputs: Claim_Modal_Credentialfallback1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credential`)
};

const es_claim_modal_credentialfallback1 = /** @type {(inputs: Claim_Modal_Credentialfallback1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credencial`)
};

const fr_claim_modal_credentialfallback1 = /** @type {(inputs: Claim_Modal_Credentialfallback1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Justificatif`)
};

const ar_claim_modal_credentialfallback1 = /** @type {(inputs: Claim_Modal_Credentialfallback1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بيانات الاعتماد`)
};

/**
* | output |
* | --- |
* | "Credential" |
*
* @param {Claim_Modal_Credentialfallback1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_modal_credentialfallback1 = /** @type {((inputs?: Claim_Modal_Credentialfallback1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_Modal_Credentialfallback1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_modal_credentialfallback1(inputs)
	if (locale === "es") return es_claim_modal_credentialfallback1(inputs)
	if (locale === "fr") return fr_claim_modal_credentialfallback1(inputs)
	return ar_claim_modal_credentialfallback1(inputs)
});
export { claim_modal_credentialfallback1 as "claim.modal.credentialFallback" }