/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claim_Didauth_Whathappens2Inputs */

const en_claim_didauth_whathappens2 = /** @type {(inputs: Claim_Didauth_Whathappens2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`What happens when you continue:`)
};

const es_claim_didauth_whathappens2 = /** @type {(inputs: Claim_Didauth_Whathappens2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Qué sucede cuando continúas:`)
};

const fr_claim_didauth_whathappens2 = /** @type {(inputs: Claim_Didauth_Whathappens2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ce qui se passe lorsque vous continuez :`)
};

const ar_claim_didauth_whathappens2 = /** @type {(inputs: Claim_Didauth_Whathappens2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ما الذي يحدث عند المتابعة:`)
};

/**
* | output |
* | --- |
* | "What happens when you continue:" |
*
* @param {Claim_Didauth_Whathappens2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_didauth_whathappens2 = /** @type {((inputs?: Claim_Didauth_Whathappens2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_Didauth_Whathappens2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_didauth_whathappens2(inputs)
	if (locale === "es") return es_claim_didauth_whathappens2(inputs)
	if (locale === "fr") return fr_claim_didauth_whathappens2(inputs)
	return ar_claim_didauth_whathappens2(inputs)
});
export { claim_didauth_whathappens2 as "claim.didAuth.whatHappens" }