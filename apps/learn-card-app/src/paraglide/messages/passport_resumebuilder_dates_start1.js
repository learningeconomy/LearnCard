/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Resumebuilder_Dates_Start1Inputs */

const en_passport_resumebuilder_dates_start1 = /** @type {(inputs: Passport_Resumebuilder_Dates_Start1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Start date`)
};

const es_passport_resumebuilder_dates_start1 = /** @type {(inputs: Passport_Resumebuilder_Dates_Start1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fecha de inicio`)
};

const fr_passport_resumebuilder_dates_start1 = /** @type {(inputs: Passport_Resumebuilder_Dates_Start1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Date de début`)
};

const ar_passport_resumebuilder_dates_start1 = /** @type {(inputs: Passport_Resumebuilder_Dates_Start1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تاريخ البدء`)
};

/**
* | output |
* | --- |
* | "Start date" |
*
* @param {Passport_Resumebuilder_Dates_Start1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_dates_start1 = /** @type {((inputs?: Passport_Resumebuilder_Dates_Start1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_Dates_Start1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_dates_start1(inputs)
	if (locale === "es") return es_passport_resumebuilder_dates_start1(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_dates_start1(inputs)
	return ar_passport_resumebuilder_dates_start1(inputs)
});
export { passport_resumebuilder_dates_start1 as "passport.resumeBuilder.dates.start" }