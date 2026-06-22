/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claim_ClaimingInputs */

const en_claim_claiming = /** @type {(inputs: Claim_ClaimingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Claiming...`)
};

const es_claim_claiming = /** @type {(inputs: Claim_ClaimingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Reclamando...`)
};

const fr_claim_claiming = /** @type {(inputs: Claim_ClaimingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Réclamation...`)
};

const ar_claim_claiming = /** @type {(inputs: Claim_ClaimingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ المطالبة...`)
};

/**
* | output |
* | --- |
* | "Claiming..." |
*
* @param {Claim_ClaimingInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_claiming = /** @type {((inputs?: Claim_ClaimingInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_ClaimingInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_claiming(inputs)
	if (locale === "es") return es_claim_claiming(inputs)
	if (locale === "fr") return fr_claim_claiming(inputs)
	return ar_claim_claiming(inputs)
});
export { claim_claiming as "claim.claiming" }