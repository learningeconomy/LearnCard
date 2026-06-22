/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claim_Redirect_DescriptionInputs */

const en_claim_redirect_description = /** @type {(inputs: Claim_Redirect_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`To continue, you need to complete a step on an external website.`)
};

const es_claim_redirect_description = /** @type {(inputs: Claim_Redirect_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Para continuar, debes completar un paso en un sitio web externo.`)
};

const fr_claim_redirect_description = /** @type {(inputs: Claim_Redirect_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pour continuer, vous devez effectuer une étape sur un site web externe.`)
};

const ar_claim_redirect_description = /** @type {(inputs: Claim_Redirect_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`للمتابعة، تحتاج إلى إكمال خطوة على موقع ويب خارجي.`)
};

/**
* | output |
* | --- |
* | "To continue, you need to complete a step on an external website." |
*
* @param {Claim_Redirect_DescriptionInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_redirect_description = /** @type {((inputs?: Claim_Redirect_DescriptionInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_Redirect_DescriptionInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_redirect_description(inputs)
	if (locale === "es") return es_claim_redirect_description(inputs)
	if (locale === "fr") return fr_claim_redirect_description(inputs)
	return ar_claim_redirect_description(inputs)
});
export { claim_redirect_description as "claim.redirect.description" }