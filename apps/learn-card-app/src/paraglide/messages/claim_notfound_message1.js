/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claim_Notfound_Message1Inputs */

const en_claim_notfound_message1 = /** @type {(inputs: Claim_Notfound_Message1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unable to find Credential`)
};

const es_claim_notfound_message1 = /** @type {(inputs: Claim_Notfound_Message1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se pudo encontrar la credencial`)
};

const fr_claim_notfound_message1 = /** @type {(inputs: Claim_Notfound_Message1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible de trouver le justificatif`)
};

const ar_claim_notfound_message1 = /** @type {(inputs: Claim_Notfound_Message1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذّر العثور على بيانات الاعتماد`)
};

/**
* | output |
* | --- |
* | "Unable to find Credential" |
*
* @param {Claim_Notfound_Message1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_notfound_message1 = /** @type {((inputs?: Claim_Notfound_Message1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_Notfound_Message1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_notfound_message1(inputs)
	if (locale === "es") return es_claim_notfound_message1(inputs)
	if (locale === "fr") return fr_claim_notfound_message1(inputs)
	return ar_claim_notfound_message1(inputs)
});
export { claim_notfound_message1 as "claim.notFound.message" }