/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claim_Modal_Acceptcredential1Inputs */

const en_claim_modal_acceptcredential1 = /** @type {(inputs: Claim_Modal_Acceptcredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accept Credential`)
};

const es_claim_modal_acceptcredential1 = /** @type {(inputs: Claim_Modal_Acceptcredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aceptar credencial`)
};

const fr_claim_modal_acceptcredential1 = /** @type {(inputs: Claim_Modal_Acceptcredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accepter le justificatif`)
};

const ar_claim_modal_acceptcredential1 = /** @type {(inputs: Claim_Modal_Acceptcredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قبول بيانات الاعتماد`)
};

/**
* | output |
* | --- |
* | "Accept Credential" |
*
* @param {Claim_Modal_Acceptcredential1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_modal_acceptcredential1 = /** @type {((inputs?: Claim_Modal_Acceptcredential1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_Modal_Acceptcredential1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_modal_acceptcredential1(inputs)
	if (locale === "es") return es_claim_modal_acceptcredential1(inputs)
	if (locale === "fr") return fr_claim_modal_acceptcredential1(inputs)
	return ar_claim_modal_acceptcredential1(inputs)
});
export { claim_modal_acceptcredential1 as "claim.modal.acceptCredential" }