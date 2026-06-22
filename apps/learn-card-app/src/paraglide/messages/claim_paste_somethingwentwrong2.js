/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claim_Paste_Somethingwentwrong2Inputs */

const en_claim_paste_somethingwentwrong2 = /** @type {(inputs: Claim_Paste_Somethingwentwrong2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Something went wrong.`)
};

const es_claim_paste_somethingwentwrong2 = /** @type {(inputs: Claim_Paste_Somethingwentwrong2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Algo salió mal.`)
};

const fr_claim_paste_somethingwentwrong2 = /** @type {(inputs: Claim_Paste_Somethingwentwrong2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Une erreur s'est produite.`)
};

const ar_claim_paste_somethingwentwrong2 = /** @type {(inputs: Claim_Paste_Somethingwentwrong2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حدث خطأ ما.`)
};

/**
* | output |
* | --- |
* | "Something went wrong." |
*
* @param {Claim_Paste_Somethingwentwrong2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_paste_somethingwentwrong2 = /** @type {((inputs?: Claim_Paste_Somethingwentwrong2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_Paste_Somethingwentwrong2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_paste_somethingwentwrong2(inputs)
	if (locale === "es") return es_claim_paste_somethingwentwrong2(inputs)
	if (locale === "fr") return fr_claim_paste_somethingwentwrong2(inputs)
	return ar_claim_paste_somethingwentwrong2(inputs)
});
export { claim_paste_somethingwentwrong2 as "claim.paste.somethingWentWrong" }