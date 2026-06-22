/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claim_Notfound_Title1Inputs */

const en_claim_notfound_title1 = /** @type {(inputs: Claim_Notfound_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Eeek!`)
};

const es_claim_notfound_title1 = /** @type {(inputs: Claim_Notfound_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Ups!`)
};

const fr_claim_notfound_title1 = /** @type {(inputs: Claim_Notfound_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Oups !`)
};

const ar_claim_notfound_title1 = /** @type {(inputs: Claim_Notfound_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عذرًا!`)
};

/**
* | output |
* | --- |
* | "Eeek!" |
*
* @param {Claim_Notfound_Title1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claim_notfound_title1 = /** @type {((inputs?: Claim_Notfound_Title1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claim_Notfound_Title1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claim_notfound_title1(inputs)
	if (locale === "es") return es_claim_notfound_title1(inputs)
	if (locale === "fr") return fr_claim_notfound_title1(inputs)
	return ar_claim_notfound_title1(inputs)
});
export { claim_notfound_title1 as "claim.notFound.title" }