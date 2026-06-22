/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Loader_Quotes_Diploma_Q13Inputs */

const en_passport_buildmylearncard_loader_quotes_diploma_q13 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Diploma_Q13Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verifying institution and degree type...`)
};

const es_passport_buildmylearncard_loader_quotes_diploma_q13 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Diploma_Q13Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verificando institución y tipo de título...`)
};

const fr_passport_buildmylearncard_loader_quotes_diploma_q13 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Diploma_Q13Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vérification de l'établissement et du type de diplôme...`)
};

const ar_passport_buildmylearncard_loader_quotes_diploma_q13 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Diploma_Q13Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نتحقق من المؤسسة ونوع الدرجة...`)
};

/**
* | output |
* | --- |
* | "Verifying institution and degree type..." |
*
* @param {Passport_Buildmylearncard_Loader_Quotes_Diploma_Q13Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_loader_quotes_diploma_q13 = /** @type {((inputs?: Passport_Buildmylearncard_Loader_Quotes_Diploma_Q13Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Loader_Quotes_Diploma_Q13Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_loader_quotes_diploma_q13(inputs)
	if (locale === "es") return es_passport_buildmylearncard_loader_quotes_diploma_q13(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_loader_quotes_diploma_q13(inputs)
	return ar_passport_buildmylearncard_loader_quotes_diploma_q13(inputs)
});
export { passport_buildmylearncard_loader_quotes_diploma_q13 as "passport.buildMyLearnCard.loader.quotes.diploma.q1" }