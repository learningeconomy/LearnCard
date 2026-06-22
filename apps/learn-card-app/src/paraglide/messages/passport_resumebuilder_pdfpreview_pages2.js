/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Resumebuilder_Pdfpreview_Pages2Inputs */

const en_passport_resumebuilder_pdfpreview_pages2 = /** @type {(inputs: Passport_Resumebuilder_Pdfpreview_Pages2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pages`)
};

const es_passport_resumebuilder_pdfpreview_pages2 = /** @type {(inputs: Passport_Resumebuilder_Pdfpreview_Pages2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Páginas`)
};

const fr_passport_resumebuilder_pdfpreview_pages2 = /** @type {(inputs: Passport_Resumebuilder_Pdfpreview_Pages2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pages`)
};

const ar_passport_resumebuilder_pdfpreview_pages2 = /** @type {(inputs: Passport_Resumebuilder_Pdfpreview_Pages2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`صفحات`)
};

/**
* | output |
* | --- |
* | "Pages" |
*
* @param {Passport_Resumebuilder_Pdfpreview_Pages2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_pdfpreview_pages2 = /** @type {((inputs?: Passport_Resumebuilder_Pdfpreview_Pages2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_Pdfpreview_Pages2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_pdfpreview_pages2(inputs)
	if (locale === "es") return es_passport_resumebuilder_pdfpreview_pages2(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_pdfpreview_pages2(inputs)
	return ar_passport_resumebuilder_pdfpreview_pages2(inputs)
});
export { passport_resumebuilder_pdfpreview_pages2 as "passport.resumeBuilder.pdfPreview.pages" }