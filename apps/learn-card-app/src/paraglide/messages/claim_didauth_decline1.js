/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claim_Didauth_Decline1Inputs */

const en_claim_didauth_decline1 = /** @type {(inputs: Claim_Didauth_Decline1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No thanks, take me home`)
};

const es_claim_didauth_decline1 = /** @type {(inputs: Claim_Didauth_Decline1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No gracias, llévame al inicio`)
};

const fr_claim_didauth_decline1 = /** @type {(inputs: Claim_Didauth_Decline1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Non merci, ramenez-moi à l'accueil`)
};

const ar_claim_didauth_decline1 = /** @type {(inputs: Claim_Didauth_Decline1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا شكرًا، خذني إلى الصفحة الرئيسية`)
};

/**
* | output |
* | --- |
* | "No thanks, take me home" |
*
* @param {Claim_Didauth_Decline1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_didauth_decline1 = /** @type {((inputs?: Claim_Didauth_Decline1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_Didauth_Decline1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_didauth_decline1(inputs)
	if (locale === "es") return es_claim_didauth_decline1(inputs)
	if (locale === "fr") return fr_claim_didauth_decline1(inputs)
	return ar_claim_didauth_decline1(inputs)
});
export { claim_didauth_decline1 as "claim.didAuth.decline" }