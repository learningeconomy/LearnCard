/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Resumebuilder_Fields_Summary_Label1Inputs */

const en_passport_resumebuilder_fields_summary_label1 = /** @type {(inputs: Passport_Resumebuilder_Fields_Summary_Label1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Professional Summary`)
};

const es_passport_resumebuilder_fields_summary_label1 = /** @type {(inputs: Passport_Resumebuilder_Fields_Summary_Label1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Resumen profesional`)
};

const fr_passport_resumebuilder_fields_summary_label1 = /** @type {(inputs: Passport_Resumebuilder_Fields_Summary_Label1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Résumé professionnel`)
};

const ar_passport_resumebuilder_fields_summary_label1 = /** @type {(inputs: Passport_Resumebuilder_Fields_Summary_Label1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الملخص المهني`)
};

/**
* | output |
* | --- |
* | "Professional Summary" |
*
* @param {Passport_Resumebuilder_Fields_Summary_Label1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_fields_summary_label1 = /** @type {((inputs?: Passport_Resumebuilder_Fields_Summary_Label1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_Fields_Summary_Label1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_fields_summary_label1(inputs)
	if (locale === "es") return es_passport_resumebuilder_fields_summary_label1(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_fields_summary_label1(inputs)
	return ar_passport_resumebuilder_fields_summary_label1(inputs)
});
export { passport_resumebuilder_fields_summary_label1 as "passport.resumeBuilder.fields.summary.label" }