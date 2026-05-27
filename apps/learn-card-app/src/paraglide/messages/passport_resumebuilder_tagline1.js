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

const de_passport_resumebuilder_tagline1 = /** @type {(inputs: Passport_Resumebuilder_Tagline1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Hebe dich mit einem maßgeschneiderten Lebenslauf ab`)
};

const ar_passport_resumebuilder_tagline1 = /** @type {(inputs: Passport_Resumebuilder_Tagline1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تميّز بسيرة ذاتية مخصصة`)
};

/**
* | output |
* | --- |
* | "Stand out with a tailored resume" |
*
* @param {Passport_Resumebuilder_Tagline1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_tagline1 = /** @type {((inputs?: Passport_Resumebuilder_Tagline1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_Tagline1Inputs, { locale?: "en" | "es" | "de" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_tagline1(inputs)
	if (locale === "es") return es_passport_resumebuilder_tagline1(inputs)
	if (locale === "de") return de_passport_resumebuilder_tagline1(inputs)
	return ar_passport_resumebuilder_tagline1(inputs)
});
export { passport_resumebuilder_tagline1 as "passport.resumeBuilder.tagline" }