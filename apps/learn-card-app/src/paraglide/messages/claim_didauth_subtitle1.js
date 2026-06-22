/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claim_Didauth_Subtitle1Inputs */

const en_claim_didauth_subtitle1 = /** @type {(inputs: Claim_Didauth_Subtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Someone wants to issue you a verifiable credential`)
};

const es_claim_didauth_subtitle1 = /** @type {(inputs: Claim_Didauth_Subtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Alguien quiere emitirte una credencial verificable`)
};

const fr_claim_didauth_subtitle1 = /** @type {(inputs: Claim_Didauth_Subtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Quelqu'un souhaite vous délivrer un justificatif vérifiable`)
};

const ar_claim_didauth_subtitle1 = /** @type {(inputs: Claim_Didauth_Subtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يرغب أحدهم في إصدار بيانات اعتماد قابلة للتحقق لك`)
};

/**
* | output |
* | --- |
* | "Someone wants to issue you a verifiable credential" |
*
* @param {Claim_Didauth_Subtitle1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_didauth_subtitle1 = /** @type {((inputs?: Claim_Didauth_Subtitle1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_Didauth_Subtitle1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_didauth_subtitle1(inputs)
	if (locale === "es") return es_claim_didauth_subtitle1(inputs)
	if (locale === "fr") return fr_claim_didauth_subtitle1(inputs)
	return ar_claim_didauth_subtitle1(inputs)
});
export { claim_didauth_subtitle1 as "claim.didAuth.subtitle" }