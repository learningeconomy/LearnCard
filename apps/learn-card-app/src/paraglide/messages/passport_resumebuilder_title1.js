/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Resumebuilder_Title1Inputs */

const en_passport_resumebuilder_title1 = /** @type {(inputs: Passport_Resumebuilder_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Resume Builder`)
};

const es_passport_resumebuilder_title1 = /** @type {(inputs: Passport_Resumebuilder_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Creador de Currículum`)
};

const de_passport_resumebuilder_title1 = /** @type {(inputs: Passport_Resumebuilder_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lebenslauf-Editor`)
};

const ar_passport_resumebuilder_title1 = /** @type {(inputs: Passport_Resumebuilder_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`منشئ السيرة الذاتية`)
};

/**
* | output |
* | --- |
* | "Resume Builder" |
*
* @param {Passport_Resumebuilder_Title1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_title1 = /** @type {((inputs?: Passport_Resumebuilder_Title1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_Title1Inputs, { locale?: "en" | "es" | "de" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_title1(inputs)
	if (locale === "es") return es_passport_resumebuilder_title1(inputs)
	if (locale === "de") return de_passport_resumebuilder_title1(inputs)
	return ar_passport_resumebuilder_title1(inputs)
});
export { passport_resumebuilder_title1 as "passport.resumeBuilder.title" }