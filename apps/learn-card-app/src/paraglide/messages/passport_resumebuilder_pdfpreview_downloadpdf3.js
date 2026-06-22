/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Resumebuilder_Pdfpreview_Downloadpdf3Inputs */

const en_passport_resumebuilder_pdfpreview_downloadpdf3 = /** @type {(inputs: Passport_Resumebuilder_Pdfpreview_Downloadpdf3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Download PDF`)
};

const es_passport_resumebuilder_pdfpreview_downloadpdf3 = /** @type {(inputs: Passport_Resumebuilder_Pdfpreview_Downloadpdf3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Descargar PDF`)
};

const fr_passport_resumebuilder_pdfpreview_downloadpdf3 = /** @type {(inputs: Passport_Resumebuilder_Pdfpreview_Downloadpdf3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Télécharger le PDF`)
};

const ar_passport_resumebuilder_pdfpreview_downloadpdf3 = /** @type {(inputs: Passport_Resumebuilder_Pdfpreview_Downloadpdf3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تنزيل PDF`)
};

/**
* | output |
* | --- |
* | "Download PDF" |
*
* @param {Passport_Resumebuilder_Pdfpreview_Downloadpdf3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_pdfpreview_downloadpdf3 = /** @type {((inputs?: Passport_Resumebuilder_Pdfpreview_Downloadpdf3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_Pdfpreview_Downloadpdf3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_pdfpreview_downloadpdf3(inputs)
	if (locale === "es") return es_passport_resumebuilder_pdfpreview_downloadpdf3(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_pdfpreview_downloadpdf3(inputs)
	return ar_passport_resumebuilder_pdfpreview_downloadpdf3(inputs)
});
export { passport_resumebuilder_pdfpreview_downloadpdf3 as "passport.resumeBuilder.pdfPreview.downloadPdf" }