/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claim_Didauth_Step11Inputs */

const en_claim_didauth_step11 = /** @type {(inputs: Claim_Didauth_Step11Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your wallet confirms your identity to the issuer`)
};

const es_claim_didauth_step11 = /** @type {(inputs: Claim_Didauth_Step11Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tu cartera confirma tu identidad al emisor`)
};

const fr_claim_didauth_step11 = /** @type {(inputs: Claim_Didauth_Step11Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Votre portefeuille confirme votre identité à l'émetteur`)
};

const ar_claim_didauth_step11 = /** @type {(inputs: Claim_Didauth_Step11Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تؤكّد محفظتك هويتك للجهة المُصدِرة`)
};

/**
* | output |
* | --- |
* | "Your wallet confirms your identity to the issuer" |
*
* @param {Claim_Didauth_Step11Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_didauth_step11 = /** @type {((inputs?: Claim_Didauth_Step11Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_Didauth_Step11Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_didauth_step11(inputs)
	if (locale === "es") return es_claim_didauth_step11(inputs)
	if (locale === "fr") return fr_claim_didauth_step11(inputs)
	return ar_claim_didauth_step11(inputs)
});
export { claim_didauth_step11 as "claim.didAuth.step1" }