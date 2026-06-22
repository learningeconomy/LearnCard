/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ message: NonNullable<unknown> }} Claim_Paste_OopsInputs */

const en_claim_paste_oops = /** @type {(inputs: Claim_Paste_OopsInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Oops! ${i?.message}`)
};

const es_claim_paste_oops = /** @type {(inputs: Claim_Paste_OopsInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`¡Ups! ${i?.message}`)
};

const fr_claim_paste_oops = /** @type {(inputs: Claim_Paste_OopsInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Oups ! ${i?.message}`)
};

const ar_claim_paste_oops = /** @type {(inputs: Claim_Paste_OopsInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`عذرًا! ${i?.message}`)
};

/**
* | output |
* | --- |
* | "Oops! {message}" |
*
* @param {Claim_Paste_OopsInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_paste_oops = /** @type {((inputs: Claim_Paste_OopsInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_Paste_OopsInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_paste_oops(inputs)
	if (locale === "es") return es_claim_paste_oops(inputs)
	if (locale === "fr") return fr_claim_paste_oops(inputs)
	return ar_claim_paste_oops(inputs)
});
export { claim_paste_oops as "claim.paste.oops" }