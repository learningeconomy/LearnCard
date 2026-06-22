/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Resumebuilder_Pdfpreview_Iframetitle3Inputs */

const en_passport_resumebuilder_pdfpreview_iframetitle3 = /** @type {(inputs: Passport_Resumebuilder_Pdfpreview_Iframetitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Resume PDF Preview`)
};

const es_passport_resumebuilder_pdfpreview_iframetitle3 = /** @type {(inputs: Passport_Resumebuilder_Pdfpreview_Iframetitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vista previa del PDF del currículum`)
};

const fr_passport_resumebuilder_pdfpreview_iframetitle3 = /** @type {(inputs: Passport_Resumebuilder_Pdfpreview_Iframetitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aperçu PDF du CV`)
};

const ar_passport_resumebuilder_pdfpreview_iframetitle3 = /** @type {(inputs: Passport_Resumebuilder_Pdfpreview_Iframetitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معاينة ملف PDF للسيرة الذاتية`)
};

/**
* | output |
* | --- |
* | "Resume PDF Preview" |
*
* @param {Passport_Resumebuilder_Pdfpreview_Iframetitle3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_pdfpreview_iframetitle3 = /** @type {((inputs?: Passport_Resumebuilder_Pdfpreview_Iframetitle3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_Pdfpreview_Iframetitle3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_pdfpreview_iframetitle3(inputs)
	if (locale === "es") return es_passport_resumebuilder_pdfpreview_iframetitle3(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_pdfpreview_iframetitle3(inputs)
	return ar_passport_resumebuilder_pdfpreview_iframetitle3(inputs)
});
export { passport_resumebuilder_pdfpreview_iframetitle3 as "passport.resumeBuilder.pdfPreview.iframeTitle" }