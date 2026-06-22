/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Loader_Quotes_Transcript_Q63Inputs */

const en_passport_buildmylearncard_loader_quotes_transcript_q63 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Transcript_Q63Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Translating transcripts into verifiable records...`)
};

const es_passport_buildmylearncard_loader_quotes_transcript_q63 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Transcript_Q63Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Traduciendo expedientes a registros verificables...`)
};

const fr_passport_buildmylearncard_loader_quotes_transcript_q63 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Transcript_Q63Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Traduction des relevés en enregistrements vérifiables...`)
};

const ar_passport_buildmylearncard_loader_quotes_transcript_q63 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Transcript_Q63Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نترجم السجلات إلى وثائق قابلة للتحقق...`)
};

/**
* | output |
* | --- |
* | "Translating transcripts into verifiable records..." |
*
* @param {Passport_Buildmylearncard_Loader_Quotes_Transcript_Q63Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_loader_quotes_transcript_q63 = /** @type {((inputs?: Passport_Buildmylearncard_Loader_Quotes_Transcript_Q63Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Loader_Quotes_Transcript_Q63Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_loader_quotes_transcript_q63(inputs)
	if (locale === "es") return es_passport_buildmylearncard_loader_quotes_transcript_q63(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_loader_quotes_transcript_q63(inputs)
	return ar_passport_buildmylearncard_loader_quotes_transcript_q63(inputs)
});
export { passport_buildmylearncard_loader_quotes_transcript_q63 as "passport.buildMyLearnCard.loader.quotes.transcript.q6" }