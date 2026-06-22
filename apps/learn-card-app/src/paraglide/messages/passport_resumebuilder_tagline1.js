/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Resumebuilder_Tagline1Inputs */

const en_passport_resumebuilder_tagline1 = /** @type {(inputs: Passport_Resumebuilder_Tagline1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Stand out with a tailored resume`)
};

const es_passport_resumebuilder_tagline1 = /** @type {(inputs: Passport_Resumebuilder_Tagline1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Destaca con un currículum personalizado`)
};

const fr_passport_resumebuilder_tagline1 = /** @type {(inputs: Passport_Resumebuilder_Tagline1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Démarquez-vous avec un CV sur mesure`)
};

const ar_passport_resumebuilder_tagline1 = /** @type {(inputs: Passport_Resumebuilder_Tagline1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تميز بسيرة ذاتية مخصصة`)
};

/**
* | output |
* | --- |
* | "Stand out with a tailored resume" |
*
* @param {Passport_Resumebuilder_Tagline1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_tagline1 = /** @type {((inputs?: Passport_Resumebuilder_Tagline1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_Tagline1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_tagline1(inputs)
	if (locale === "es") return es_passport_resumebuilder_tagline1(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_tagline1(inputs)
	return ar_passport_resumebuilder_tagline1(inputs)
});
export { passport_resumebuilder_tagline1 as "passport.resumeBuilder.tagline" }