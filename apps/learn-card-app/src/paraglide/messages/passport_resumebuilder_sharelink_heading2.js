/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ brand: NonNullable<unknown> }} Passport_Resumebuilder_Sharelink_Heading2Inputs */

const en_passport_resumebuilder_sharelink_heading2 = /** @type {(inputs: Passport_Resumebuilder_Sharelink_Heading2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Share your ${i?.brand} resume`)
};

const es_passport_resumebuilder_sharelink_heading2 = /** @type {(inputs: Passport_Resumebuilder_Sharelink_Heading2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Comparte tu currículum de ${i?.brand}`)
};

const fr_passport_resumebuilder_sharelink_heading2 = /** @type {(inputs: Passport_Resumebuilder_Sharelink_Heading2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Partagez votre CV ${i?.brand}`)
};

const ar_passport_resumebuilder_sharelink_heading2 = /** @type {(inputs: Passport_Resumebuilder_Sharelink_Heading2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`شارك سيرتك الذاتية في ${i?.brand}`)
};

/**
* | output |
* | --- |
* | "Share your {brand} resume" |
*
* @param {Passport_Resumebuilder_Sharelink_Heading2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_sharelink_heading2 = /** @type {((inputs: Passport_Resumebuilder_Sharelink_Heading2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_Sharelink_Heading2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_sharelink_heading2(inputs)
	if (locale === "es") return es_passport_resumebuilder_sharelink_heading2(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_sharelink_heading2(inputs)
	return ar_passport_resumebuilder_sharelink_heading2(inputs)
});
export { passport_resumebuilder_sharelink_heading2 as "passport.resumeBuilder.shareLink.heading" }