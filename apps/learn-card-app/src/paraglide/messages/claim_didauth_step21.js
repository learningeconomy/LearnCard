/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claim_Didauth_Step21Inputs */

const en_claim_didauth_step21 = /** @type {(inputs: Claim_Didauth_Step21Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`The credential is securely delivered to your wallet`)
};

const es_claim_didauth_step21 = /** @type {(inputs: Claim_Didauth_Step21Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`La credencial se entrega de forma segura en tu cartera`)
};

const fr_claim_didauth_step21 = /** @type {(inputs: Claim_Didauth_Step21Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Le justificatif est remis en toute sécurité dans votre portefeuille`)
};

const ar_claim_didauth_step21 = /** @type {(inputs: Claim_Didauth_Step21Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يتم تسليم بيانات الاعتماد بأمان إلى محفظتك`)
};

/**
* | output |
* | --- |
* | "The credential is securely delivered to your wallet" |
*
* @param {Claim_Didauth_Step21Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_didauth_step21 = /** @type {((inputs?: Claim_Didauth_Step21Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_Didauth_Step21Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_didauth_step21(inputs)
	if (locale === "es") return es_claim_didauth_step21(inputs)
	if (locale === "fr") return fr_claim_didauth_step21(inputs)
	return ar_claim_didauth_step21(inputs)
});
export { claim_didauth_step21 as "claim.didAuth.step2" }