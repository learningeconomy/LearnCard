/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Resumebuilder_Pdfpreview_Defaultname3Inputs */

const en_passport_resumebuilder_pdfpreview_defaultname3 = /** @type {(inputs: Passport_Resumebuilder_Pdfpreview_Defaultname3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Resume Preview`)
};

const es_passport_resumebuilder_pdfpreview_defaultname3 = /** @type {(inputs: Passport_Resumebuilder_Pdfpreview_Defaultname3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vista previa del currículum`)
};

const fr_passport_resumebuilder_pdfpreview_defaultname3 = /** @type {(inputs: Passport_Resumebuilder_Pdfpreview_Defaultname3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aperçu du CV`)
};

const ar_passport_resumebuilder_pdfpreview_defaultname3 = /** @type {(inputs: Passport_Resumebuilder_Pdfpreview_Defaultname3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معاينة السيرة الذاتية`)
};

/**
* | output |
* | --- |
* | "Resume Preview" |
*
* @param {Passport_Resumebuilder_Pdfpreview_Defaultname3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_pdfpreview_defaultname3 = /** @type {((inputs?: Passport_Resumebuilder_Pdfpreview_Defaultname3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_Pdfpreview_Defaultname3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_pdfpreview_defaultname3(inputs)
	if (locale === "es") return es_passport_resumebuilder_pdfpreview_defaultname3(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_pdfpreview_defaultname3(inputs)
	return ar_passport_resumebuilder_pdfpreview_defaultname3(inputs)
});
export { passport_resumebuilder_pdfpreview_defaultname3 as "passport.resumeBuilder.pdfPreview.defaultName" }