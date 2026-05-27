/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Resumebuilder_Buildyourresume3Inputs */

const en_passport_resumebuilder_buildyourresume3 = /** @type {(inputs: Passport_Resumebuilder_Buildyourresume3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Build Your Resume`)
};

const es_passport_resumebuilder_buildyourresume3 = /** @type {(inputs: Passport_Resumebuilder_Buildyourresume3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crea Tu Currículum`)
};

const de_passport_resumebuilder_buildyourresume3 = /** @type {(inputs: Passport_Resumebuilder_Buildyourresume3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lebenslauf erstellen`)
};

const ar_passport_resumebuilder_buildyourresume3 = /** @type {(inputs: Passport_Resumebuilder_Buildyourresume3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أنشئ سيرتك الذاتية`)
};

/**
* | output |
* | --- |
* | "Build Your Resume" |
*
* @param {Passport_Resumebuilder_Buildyourresume3Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_buildyourresume3 = /** @type {((inputs?: Passport_Resumebuilder_Buildyourresume3Inputs, options?: { locale?: "en" | "es" | "de" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_Buildyourresume3Inputs, { locale?: "en" | "es" | "de" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_buildyourresume3(inputs)
	if (locale === "es") return es_passport_resumebuilder_buildyourresume3(inputs)
	if (locale === "de") return de_passport_resumebuilder_buildyourresume3(inputs)
	return ar_passport_resumebuilder_buildyourresume3(inputs)
});
export { passport_resumebuilder_buildyourresume3 as "passport.resumeBuilder.buildYourResume" }