/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claim_Modal_Claimedtitle1Inputs */

const en_claim_modal_claimedtitle1 = /** @type {(inputs: Claim_Modal_Claimedtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credential Claimed!`)
};

const es_claim_modal_claimedtitle1 = /** @type {(inputs: Claim_Modal_Claimedtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Credencial reclamada!`)
};

const fr_claim_modal_claimedtitle1 = /** @type {(inputs: Claim_Modal_Claimedtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Justificatif réclamé !`)
};

const ar_claim_modal_claimedtitle1 = /** @type {(inputs: Claim_Modal_Claimedtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تمت المطالبة ببيانات الاعتماد!`)
};

/**
* | output |
* | --- |
* | "Credential Claimed!" |
*
* @param {Claim_Modal_Claimedtitle1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_modal_claimedtitle1 = /** @type {((inputs?: Claim_Modal_Claimedtitle1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_Modal_Claimedtitle1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_modal_claimedtitle1(inputs)
	if (locale === "es") return es_claim_modal_claimedtitle1(inputs)
	if (locale === "fr") return fr_claim_modal_claimedtitle1(inputs)
	return ar_claim_modal_claimedtitle1(inputs)
});
export { claim_modal_claimedtitle1 as "claim.modal.claimedTitle" }