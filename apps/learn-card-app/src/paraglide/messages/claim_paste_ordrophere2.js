/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claim_Paste_Ordrophere2Inputs */

const en_claim_paste_ordrophere2 = /** @type {(inputs: Claim_Paste_Ordrophere2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`or drop it here`)
};

const es_claim_paste_ordrophere2 = /** @type {(inputs: Claim_Paste_Ordrophere2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`o suéltalo aquí`)
};

const fr_claim_paste_ordrophere2 = /** @type {(inputs: Claim_Paste_Ordrophere2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ou déposez-le ici`)
};

const ar_claim_paste_ordrophere2 = /** @type {(inputs: Claim_Paste_Ordrophere2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أو أفلِتها هنا`)
};

/**
* | output |
* | --- |
* | "or drop it here" |
*
* @param {Claim_Paste_Ordrophere2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_paste_ordrophere2 = /** @type {((inputs?: Claim_Paste_Ordrophere2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_Paste_Ordrophere2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_paste_ordrophere2(inputs)
	if (locale === "es") return es_claim_paste_ordrophere2(inputs)
	if (locale === "fr") return fr_claim_paste_ordrophere2(inputs)
	return ar_claim_paste_ordrophere2(inputs)
});
export { claim_paste_ordrophere2 as "claim.paste.orDropHere" }