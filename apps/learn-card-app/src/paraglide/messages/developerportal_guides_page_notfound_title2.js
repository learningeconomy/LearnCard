/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Page_Notfound_Title2Inputs */

const en_developerportal_guides_page_notfound_title2 = /** @type {(inputs: Developerportal_Guides_Page_Notfound_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guide Not Found`)
};

const es_developerportal_guides_page_notfound_title2 = /** @type {(inputs: Developerportal_Guides_Page_Notfound_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guía No Encontrada`)
};

const fr_developerportal_guides_page_notfound_title2 = /** @type {(inputs: Developerportal_Guides_Page_Notfound_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guide Introuvable`)
};

const ar_developerportal_guides_page_notfound_title2 = /** @type {(inputs: Developerportal_Guides_Page_Notfound_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الدليل غير موجود`)
};

/**
* | output |
* | --- |
* | "Guide Not Found" |
*
* @param {Developerportal_Guides_Page_Notfound_Title2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_page_notfound_title2 = /** @type {((inputs?: Developerportal_Guides_Page_Notfound_Title2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Page_Notfound_Title2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_page_notfound_title2(inputs)
	if (locale === "es") return es_developerportal_guides_page_notfound_title2(inputs)
	if (locale === "fr") return fr_developerportal_guides_page_notfound_title2(inputs)
	return ar_developerportal_guides_page_notfound_title2(inputs)
});
export { developerportal_guides_page_notfound_title2 as "developerPortal.guides.page.notFound.title" }