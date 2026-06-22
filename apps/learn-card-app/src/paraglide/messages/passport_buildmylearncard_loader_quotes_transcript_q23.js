/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Loader_Quotes_Transcript_Q23Inputs */

const en_passport_buildmylearncard_loader_quotes_transcript_q23 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Transcript_Q23Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mapping your educational timeline...`)
};

const es_passport_buildmylearncard_loader_quotes_transcript_q23 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Transcript_Q23Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mapeando tu línea de tiempo educativa...`)
};

const fr_passport_buildmylearncard_loader_quotes_transcript_q23 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Transcript_Q23Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cartographie de votre chronologie éducative...`)
};

const ar_passport_buildmylearncard_loader_quotes_transcript_q23 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Transcript_Q23Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نرسم خطك الزمني التعليمي...`)
};

/**
* | output |
* | --- |
* | "Mapping your educational timeline..." |
*
* @param {Passport_Buildmylearncard_Loader_Quotes_Transcript_Q23Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_loader_quotes_transcript_q23 = /** @type {((inputs?: Passport_Buildmylearncard_Loader_Quotes_Transcript_Q23Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Loader_Quotes_Transcript_Q23Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_loader_quotes_transcript_q23(inputs)
	if (locale === "es") return es_passport_buildmylearncard_loader_quotes_transcript_q23(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_loader_quotes_transcript_q23(inputs)
	return ar_passport_buildmylearncard_loader_quotes_transcript_q23(inputs)
});
export { passport_buildmylearncard_loader_quotes_transcript_q23 as "passport.buildMyLearnCard.loader.quotes.transcript.q2" }