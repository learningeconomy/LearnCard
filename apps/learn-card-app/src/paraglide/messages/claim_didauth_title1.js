/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claim_Didauth_Title1Inputs */

const en_claim_didauth_title1 = /** @type {(inputs: Claim_Didauth_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You've Been Sent a Credential!`)
};

const es_claim_didauth_title1 = /** @type {(inputs: Claim_Didauth_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Te han enviado una credencial!`)
};

const fr_claim_didauth_title1 = /** @type {(inputs: Claim_Didauth_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Un justificatif vous a été envoyé !`)
};

const ar_claim_didauth_title1 = /** @type {(inputs: Claim_Didauth_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لقد تم إرسال بيانات اعتماد إليك!`)
};

/**
* | output |
* | --- |
* | "You've Been Sent a Credential!" |
*
* @param {Claim_Didauth_Title1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_didauth_title1 = /** @type {((inputs?: Claim_Didauth_Title1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_Didauth_Title1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_didauth_title1(inputs)
	if (locale === "es") return es_claim_didauth_title1(inputs)
	if (locale === "fr") return fr_claim_didauth_title1(inputs)
	return ar_claim_didauth_title1(inputs)
});
export { claim_didauth_title1 as "claim.didAuth.title" }