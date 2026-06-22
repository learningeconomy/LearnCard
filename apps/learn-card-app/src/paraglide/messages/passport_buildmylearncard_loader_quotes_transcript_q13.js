/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Loader_Quotes_Transcript_Q13Inputs */

const en_passport_buildmylearncard_loader_quotes_transcript_q13 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Transcript_Q13Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Extracting course history and grades...`)
};

const es_passport_buildmylearncard_loader_quotes_transcript_q13 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Transcript_Q13Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Extrayendo el historial de cursos y calificaciones...`)
};

const fr_passport_buildmylearncard_loader_quotes_transcript_q13 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Transcript_Q13Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Extraction de l'historique des cours et des notes...`)
};

const ar_passport_buildmylearncard_loader_quotes_transcript_q13 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Transcript_Q13Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نستخرج سجل المقررات والدرجات...`)
};

/**
* | output |
* | --- |
* | "Extracting course history and grades..." |
*
* @param {Passport_Buildmylearncard_Loader_Quotes_Transcript_Q13Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_loader_quotes_transcript_q13 = /** @type {((inputs?: Passport_Buildmylearncard_Loader_Quotes_Transcript_Q13Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Loader_Quotes_Transcript_Q13Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_loader_quotes_transcript_q13(inputs)
	if (locale === "es") return es_passport_buildmylearncard_loader_quotes_transcript_q13(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_loader_quotes_transcript_q13(inputs)
	return ar_passport_buildmylearncard_loader_quotes_transcript_q13(inputs)
});
export { passport_buildmylearncard_loader_quotes_transcript_q13 as "passport.buildMyLearnCard.loader.quotes.transcript.q1" }