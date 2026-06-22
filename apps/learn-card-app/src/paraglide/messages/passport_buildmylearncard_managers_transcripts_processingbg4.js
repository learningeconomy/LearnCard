/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Managers_Transcripts_Processingbg4Inputs */

const en_passport_buildmylearncard_managers_transcripts_processingbg4 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Transcripts_Processingbg4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Processing your transcripts in the background...`)
};

const es_passport_buildmylearncard_managers_transcripts_processingbg4 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Transcripts_Processingbg4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Procesando tus expedientes en segundo plano...`)
};

const fr_passport_buildmylearncard_managers_transcripts_processingbg4 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Transcripts_Processingbg4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Traitement de vos relevés en arrière-plan...`)
};

const ar_passport_buildmylearncard_managers_transcripts_processingbg4 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Transcripts_Processingbg4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ معالجة كشوف درجاتك في الخلفية...`)
};

/**
* | output |
* | --- |
* | "Processing your transcripts in the background..." |
*
* @param {Passport_Buildmylearncard_Managers_Transcripts_Processingbg4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_managers_transcripts_processingbg4 = /** @type {((inputs?: Passport_Buildmylearncard_Managers_Transcripts_Processingbg4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Managers_Transcripts_Processingbg4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_managers_transcripts_processingbg4(inputs)
	if (locale === "es") return es_passport_buildmylearncard_managers_transcripts_processingbg4(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_managers_transcripts_processingbg4(inputs)
	return ar_passport_buildmylearncard_managers_transcripts_processingbg4(inputs)
});
export { passport_buildmylearncard_managers_transcripts_processingbg4 as "passport.buildMyLearnCard.managers.transcripts.processingBg" }