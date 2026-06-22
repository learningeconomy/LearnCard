/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Page_Notfound_Description2Inputs */

const en_developerportal_guides_page_notfound_description2 = /** @type {(inputs: Developerportal_Guides_Page_Notfound_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`The guide you're looking for doesn't exist.`)
};

const es_developerportal_guides_page_notfound_description2 = /** @type {(inputs: Developerportal_Guides_Page_Notfound_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`La guía que buscas no existe.`)
};

const fr_developerportal_guides_page_notfound_description2 = /** @type {(inputs: Developerportal_Guides_Page_Notfound_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Le guide que vous recherchez n'existe pas.`)
};

const ar_developerportal_guides_page_notfound_description2 = /** @type {(inputs: Developerportal_Guides_Page_Notfound_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الدليل الذي تبحث عنه غير موجود.`)
};

/**
* | output |
* | --- |
* | "The guide you're looking for doesn't exist." |
*
* @param {Developerportal_Guides_Page_Notfound_Description2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_page_notfound_description2 = /** @type {((inputs?: Developerportal_Guides_Page_Notfound_Description2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Page_Notfound_Description2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_page_notfound_description2(inputs)
	if (locale === "es") return es_developerportal_guides_page_notfound_description2(inputs)
	if (locale === "fr") return fr_developerportal_guides_page_notfound_description2(inputs)
	return ar_developerportal_guides_page_notfound_description2(inputs)
});
export { developerportal_guides_page_notfound_description2 as "developerPortal.guides.page.notFound.description" }