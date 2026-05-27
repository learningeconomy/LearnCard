/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Resumebuilder_Yourresume2Inputs */

const en_passport_resumebuilder_yourresume2 = /** @type {(inputs: Passport_Resumebuilder_Yourresume2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your Resume`)
};

const es_passport_resumebuilder_yourresume2 = /** @type {(inputs: Passport_Resumebuilder_Yourresume2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tu Currículum`)
};

const de_passport_resumebuilder_yourresume2 = /** @type {(inputs: Passport_Resumebuilder_Yourresume2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Dein Lebenslauf`)
};

const ar_passport_resumebuilder_yourresume2 = /** @type {(inputs: Passport_Resumebuilder_Yourresume2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سيرتك الذاتية`)
};

/**
* | output |
* | --- |
* | "Your Resume" |
*
* @param {Passport_Resumebuilder_Yourresume2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_yourresume2 = /** @type {((inputs?: Passport_Resumebuilder_Yourresume2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_Yourresume2Inputs, { locale?: "en" | "es" | "de" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_yourresume2(inputs)
	if (locale === "es") return es_passport_resumebuilder_yourresume2(inputs)
	if (locale === "de") return de_passport_resumebuilder_yourresume2(inputs)
	return ar_passport_resumebuilder_yourresume2(inputs)
});
export { passport_resumebuilder_yourresume2 as "passport.resumeBuilder.yourResume" }