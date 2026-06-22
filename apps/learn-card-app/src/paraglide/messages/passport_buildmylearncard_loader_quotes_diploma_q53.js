/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Buildmylearncard_Loader_Quotes_Diploma_Q53Inputs */

const en_passport_buildmylearncard_loader_quotes_diploma_q53 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Diploma_Q53Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Extracting awarded date and field of study...`)
};

const es_passport_buildmylearncard_loader_quotes_diploma_q53 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Diploma_Q53Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Extrayendo fecha de obtención y campo de estudio...`)
};

const fr_passport_buildmylearncard_loader_quotes_diploma_q53 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Diploma_Q53Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Extraction de la date d'obtention et du domaine d'études...`)
};

const ar_passport_buildmylearncard_loader_quotes_diploma_q53 = /** @type {(inputs: Passport_Buildmylearncard_Loader_Quotes_Diploma_Q53Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نستخرج تاريخ المنح ومجال الدراسة...`)
};

/**
* | output |
* | --- |
* | "Extracting awarded date and field of study..." |
*
* @param {Passport_Buildmylearncard_Loader_Quotes_Diploma_Q53Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_loader_quotes_diploma_q53 = /** @type {((inputs?: Passport_Buildmylearncard_Loader_Quotes_Diploma_Q53Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Loader_Quotes_Diploma_Q53Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_loader_quotes_diploma_q53(inputs)
	if (locale === "es") return es_passport_buildmylearncard_loader_quotes_diploma_q53(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_loader_quotes_diploma_q53(inputs)
	return ar_passport_buildmylearncard_loader_quotes_diploma_q53(inputs)
});
export { passport_buildmylearncard_loader_quotes_diploma_q53 as "passport.buildMyLearnCard.loader.quotes.diploma.q5" }