/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Resumebuilder_Sections_Workhistory2Inputs */

const en_passport_resumebuilder_sections_workhistory2 = /** @type {(inputs: Passport_Resumebuilder_Sections_Workhistory2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Work Experience`)
};

const es_passport_resumebuilder_sections_workhistory2 = /** @type {(inputs: Passport_Resumebuilder_Sections_Workhistory2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Experiencia laboral`)
};

const fr_passport_resumebuilder_sections_workhistory2 = /** @type {(inputs: Passport_Resumebuilder_Sections_Workhistory2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Expérience professionnelle`)
};

const ar_passport_resumebuilder_sections_workhistory2 = /** @type {(inputs: Passport_Resumebuilder_Sections_Workhistory2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الخبرة العملية`)
};

/**
* | output |
* | --- |
* | "Work Experience" |
*
* @param {Passport_Resumebuilder_Sections_Workhistory2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_sections_workhistory2 = /** @type {((inputs?: Passport_Resumebuilder_Sections_Workhistory2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_Sections_Workhistory2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_sections_workhistory2(inputs)
	if (locale === "es") return es_passport_resumebuilder_sections_workhistory2(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_sections_workhistory2(inputs)
	return ar_passport_resumebuilder_sections_workhistory2(inputs)
});
export { passport_resumebuilder_sections_workhistory2 as "passport.resumeBuilder.sections.workHistory" }