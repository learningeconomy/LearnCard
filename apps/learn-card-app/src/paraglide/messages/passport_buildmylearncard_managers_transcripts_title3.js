/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Managers_Transcripts_Title3Inputs */

const en_passport_buildmylearncard_managers_transcripts_title3 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Transcripts_Title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Transcripts`)
};

const es_passport_buildmylearncard_managers_transcripts_title3 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Transcripts_Title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Expedientes académicos`)
};

const fr_passport_buildmylearncard_managers_transcripts_title3 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Transcripts_Title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Relevés de notes`)
};

const ar_passport_buildmylearncard_managers_transcripts_title3 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Transcripts_Title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`كشوف الدرجات`)
};

/**
* | output |
* | --- |
* | "Transcripts" |
*
* @param {Passport_Buildmylearncard_Managers_Transcripts_Title3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_managers_transcripts_title3 = /** @type {((inputs?: Passport_Buildmylearncard_Managers_Transcripts_Title3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Managers_Transcripts_Title3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_managers_transcripts_title3(inputs)
	if (locale === "es") return es_passport_buildmylearncard_managers_transcripts_title3(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_managers_transcripts_title3(inputs)
	return ar_passport_buildmylearncard_managers_transcripts_title3(inputs)
});
export { passport_buildmylearncard_managers_transcripts_title3 as "passport.buildMyLearnCard.managers.transcripts.title" }