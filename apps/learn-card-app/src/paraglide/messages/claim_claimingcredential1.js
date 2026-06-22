/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claim_Claimingcredential1Inputs */

const en_claim_claimingcredential1 = /** @type {(inputs: Claim_Claimingcredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Claiming Credential`)
};

const es_claim_claimingcredential1 = /** @type {(inputs: Claim_Claimingcredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Reclamando credencial`)
};

const fr_claim_claimingcredential1 = /** @type {(inputs: Claim_Claimingcredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Réclamation du justificatif`)
};

const ar_claim_claimingcredential1 = /** @type {(inputs: Claim_Claimingcredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ المطالبة ببيانات الاعتماد`)
};

/**
* | output |
* | --- |
* | "Claiming Credential" |
*
* @param {Claim_Claimingcredential1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_claimingcredential1 = /** @type {((inputs?: Claim_Claimingcredential1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_Claimingcredential1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_claimingcredential1(inputs)
	if (locale === "es") return es_claim_claimingcredential1(inputs)
	if (locale === "fr") return fr_claim_claimingcredential1(inputs)
	return ar_claim_claimingcredential1(inputs)
});
export { claim_claimingcredential1 as "claim.claimingCredential" }