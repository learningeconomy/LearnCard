/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Loader_Quotes_Transcript_Q33Inputs */

const en_passport_buildmylearncard_loader_quotes_transcript_q33 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Transcript_Q33Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Reading earned credits and GPA (if available)...`)
};

const es_passport_buildmylearncard_loader_quotes_transcript_q33 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Transcript_Q33Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Leyendo créditos obtenidos y GPA (si está disponible)...`)
};

const fr_passport_buildmylearncard_loader_quotes_transcript_q33 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Transcript_Q33Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lecture des crédits obtenus et du GPA (si disponible)...`)
};

const ar_passport_buildmylearncard_loader_quotes_transcript_q33 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Transcript_Q33Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نقرأ الساعات المعتمدة والمعدل (إن وُجد)...`)
};

/**
* | output |
* | --- |
* | "Reading earned credits and GPA (if available)..." |
*
* @param {Passport_Buildmylearncard_Loader_Quotes_Transcript_Q33Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_loader_quotes_transcript_q33 = /** @type {((inputs?: Passport_Buildmylearncard_Loader_Quotes_Transcript_Q33Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Loader_Quotes_Transcript_Q33Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_loader_quotes_transcript_q33(inputs)
	if (locale === "es") return es_passport_buildmylearncard_loader_quotes_transcript_q33(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_loader_quotes_transcript_q33(inputs)
	return ar_passport_buildmylearncard_loader_quotes_transcript_q33(inputs)
});
export { passport_buildmylearncard_loader_quotes_transcript_q33 as "passport.buildMyLearnCard.loader.quotes.transcript.q3" }