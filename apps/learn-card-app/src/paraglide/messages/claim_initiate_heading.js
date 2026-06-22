/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claim_Initiate_HeadingInputs */

const en_claim_initiate_heading = /** @type {(inputs: Claim_Initiate_HeadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You've been sent a request`)
};

const es_claim_initiate_heading = /** @type {(inputs: Claim_Initiate_HeadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Te han enviado una solicitud`)
};

const fr_claim_initiate_heading = /** @type {(inputs: Claim_Initiate_HeadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Une demande vous a été envoyée`)
};

const ar_claim_initiate_heading = /** @type {(inputs: Claim_Initiate_HeadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لقد تم إرسال طلب إليك`)
};

/**
* | output |
* | --- |
* | "You've been sent a request" |
*
* @param {Claim_Initiate_HeadingInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_initiate_heading = /** @type {((inputs?: Claim_Initiate_HeadingInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_Initiate_HeadingInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_initiate_heading(inputs)
	if (locale === "es") return es_claim_initiate_heading(inputs)
	if (locale === "fr") return fr_claim_initiate_heading(inputs)
	return ar_claim_initiate_heading(inputs)
});
export { claim_initiate_heading as "claim.initiate.heading" }