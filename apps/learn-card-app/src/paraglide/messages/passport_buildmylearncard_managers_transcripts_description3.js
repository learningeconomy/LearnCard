/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Managers_Transcripts_Description3Inputs */

const en_passport_buildmylearncard_managers_transcripts_description3 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Transcripts_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Upload academic transcripts or joint service transcripts.`)
};

const es_passport_buildmylearncard_managers_transcripts_description3 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Transcripts_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sube expedientes académicos o expedientes de servicio conjunto.`)
};

const fr_passport_buildmylearncard_managers_transcripts_description3 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Transcripts_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Téléchargez des relevés de notes scolaires ou des relevés de service interarmées.`)
};

const ar_passport_buildmylearncard_managers_transcripts_description3 = /** @type {(inputs: Passport_Buildmylearncard_Managers_Transcripts_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ارفع كشوف الدرجات الأكاديمية أو كشوف الخدمة المشتركة.`)
};

/**
* | output |
* | --- |
* | "Upload academic transcripts or joint service transcripts." |
*
* @param {Passport_Buildmylearncard_Managers_Transcripts_Description3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_managers_transcripts_description3 = /** @type {((inputs?: Passport_Buildmylearncard_Managers_Transcripts_Description3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Managers_Transcripts_Description3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_managers_transcripts_description3(inputs)
	if (locale === "es") return es_passport_buildmylearncard_managers_transcripts_description3(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_managers_transcripts_description3(inputs)
	return ar_passport_buildmylearncard_managers_transcripts_description3(inputs)
});
export { passport_buildmylearncard_managers_transcripts_description3 as "passport.buildMyLearnCard.managers.transcripts.description" }