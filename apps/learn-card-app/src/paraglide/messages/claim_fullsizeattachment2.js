/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claim_Fullsizeattachment2Inputs */

const en_claim_fullsizeattachment2 = /** @type {(inputs: Claim_Fullsizeattachment2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Full size attachment`)
};

const es_claim_fullsizeattachment2 = /** @type {(inputs: Claim_Fullsizeattachment2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Archivo adjunto a tamaño completo`)
};

const fr_claim_fullsizeattachment2 = /** @type {(inputs: Claim_Fullsizeattachment2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pièce jointe en taille réelle`)
};

const ar_claim_fullsizeattachment2 = /** @type {(inputs: Claim_Fullsizeattachment2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مرفق بالحجم الكامل`)
};

/**
* | output |
* | --- |
* | "Full size attachment" |
*
* @param {Claim_Fullsizeattachment2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_fullsizeattachment2 = /** @type {((inputs?: Claim_Fullsizeattachment2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_Fullsizeattachment2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_fullsizeattachment2(inputs)
	if (locale === "es") return es_claim_fullsizeattachment2(inputs)
	if (locale === "fr") return fr_claim_fullsizeattachment2(inputs)
	return ar_claim_fullsizeattachment2(inputs)
});
export { claim_fullsizeattachment2 as "claim.fullSizeAttachment" }