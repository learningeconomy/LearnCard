/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Resumebuilder_Title1Inputs */

const en_passport_resumebuilder_title1 = /** @type {(inputs: Passport_Resumebuilder_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Resume Builder`)
};

const es_passport_resumebuilder_title1 = /** @type {(inputs: Passport_Resumebuilder_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Creador de currículum`)
};

const de_passport_resumebuilder_title1 = /** @type {(inputs: Passport_Resumebuilder_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lebenslauf-Generator`)
};

const ar_passport_resumebuilder_title1 = /** @type {(inputs: Passport_Resumebuilder_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`منشئ السيرة الذاتية`)
};

const fr_passport_resumebuilder_title1 = /** @type {(inputs: Passport_Resumebuilder_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créateur de CV`)
};

const ko_passport_resumebuilder_title1 = /** @type {(inputs: Passport_Resumebuilder_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이력서 작성기`)
};

/**
* | output |
* | --- |
* | "Resume Builder" |
*
* @param {Passport_Resumebuilder_Title1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_title1 = /** @type {((inputs?: Passport_Resumebuilder_Title1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_Title1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_title1(inputs)
	if (locale === "es") return es_passport_resumebuilder_title1(inputs)
	if (locale === "de") return de_passport_resumebuilder_title1(inputs)
	if (locale === "ar") return ar_passport_resumebuilder_title1(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_title1(inputs)
	return ko_passport_resumebuilder_title1(inputs)
});
export { passport_resumebuilder_title1 as "passport.resumeBuilder.title" }