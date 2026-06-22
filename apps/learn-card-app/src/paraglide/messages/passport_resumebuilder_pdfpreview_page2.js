/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Resumebuilder_Pdfpreview_Page2Inputs */

const en_passport_resumebuilder_pdfpreview_page2 = /** @type {(inputs: Passport_Resumebuilder_Pdfpreview_Page2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Page`)
};

const es_passport_resumebuilder_pdfpreview_page2 = /** @type {(inputs: Passport_Resumebuilder_Pdfpreview_Page2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Página`)
};

const fr_passport_resumebuilder_pdfpreview_page2 = /** @type {(inputs: Passport_Resumebuilder_Pdfpreview_Page2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Page`)
};

const ar_passport_resumebuilder_pdfpreview_page2 = /** @type {(inputs: Passport_Resumebuilder_Pdfpreview_Page2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`صفحة`)
};

/**
* | output |
* | --- |
* | "Page" |
*
* @param {Passport_Resumebuilder_Pdfpreview_Page2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_pdfpreview_page2 = /** @type {((inputs?: Passport_Resumebuilder_Pdfpreview_Page2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_Pdfpreview_Page2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_pdfpreview_page2(inputs)
	if (locale === "es") return es_passport_resumebuilder_pdfpreview_page2(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_pdfpreview_page2(inputs)
	return ar_passport_resumebuilder_pdfpreview_page2(inputs)
});
export { passport_resumebuilder_pdfpreview_page2 as "passport.resumeBuilder.pdfPreview.page" }