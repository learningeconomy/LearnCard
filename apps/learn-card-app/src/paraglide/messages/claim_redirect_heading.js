/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claim_Redirect_HeadingInputs */

const en_claim_redirect_heading = /** @type {(inputs: Claim_Redirect_HeadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Redirect Required`)
};

const es_claim_redirect_heading = /** @type {(inputs: Claim_Redirect_HeadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Redirección requerida`)
};

const fr_claim_redirect_heading = /** @type {(inputs: Claim_Redirect_HeadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Redirection requise`)
};

const ar_claim_redirect_heading = /** @type {(inputs: Claim_Redirect_HeadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إعادة التوجيه مطلوبة`)
};

/**
* | output |
* | --- |
* | "Redirect Required" |
*
* @param {Claim_Redirect_HeadingInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_redirect_heading = /** @type {((inputs?: Claim_Redirect_HeadingInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_Redirect_HeadingInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_redirect_heading(inputs)
	if (locale === "es") return es_claim_redirect_heading(inputs)
	if (locale === "fr") return fr_claim_redirect_heading(inputs)
	return ar_claim_redirect_heading(inputs)
});
export { claim_redirect_heading as "claim.redirect.heading" }