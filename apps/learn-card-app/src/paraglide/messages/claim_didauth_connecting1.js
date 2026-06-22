/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claim_Didauth_Connecting1Inputs */

const en_claim_didauth_connecting1 = /** @type {(inputs: Claim_Didauth_Connecting1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connecting...`)
};

const es_claim_didauth_connecting1 = /** @type {(inputs: Claim_Didauth_Connecting1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Conectando...`)
};

const fr_claim_didauth_connecting1 = /** @type {(inputs: Claim_Didauth_Connecting1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connexion...`)
};

const ar_claim_didauth_connecting1 = /** @type {(inputs: Claim_Didauth_Connecting1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ الاتصال...`)
};

/**
* | output |
* | --- |
* | "Connecting..." |
*
* @param {Claim_Didauth_Connecting1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_didauth_connecting1 = /** @type {((inputs?: Claim_Didauth_Connecting1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_Didauth_Connecting1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_didauth_connecting1(inputs)
	if (locale === "es") return es_claim_didauth_connecting1(inputs)
	if (locale === "fr") return fr_claim_didauth_connecting1(inputs)
	return ar_claim_didauth_connecting1(inputs)
});
export { claim_didauth_connecting1 as "claim.didAuth.connecting" }