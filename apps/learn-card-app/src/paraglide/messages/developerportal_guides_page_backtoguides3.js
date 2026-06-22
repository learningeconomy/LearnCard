/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Page_Backtoguides3Inputs */

const en_developerportal_guides_page_backtoguides3 = /** @type {(inputs: Developerportal_Guides_Page_Backtoguides3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Back to Guides`)
};

const es_developerportal_guides_page_backtoguides3 = /** @type {(inputs: Developerportal_Guides_Page_Backtoguides3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Volver a Guías`)
};

const fr_developerportal_guides_page_backtoguides3 = /** @type {(inputs: Developerportal_Guides_Page_Backtoguides3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Retour aux Guides`)
};

const ar_developerportal_guides_page_backtoguides3 = /** @type {(inputs: Developerportal_Guides_Page_Backtoguides3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`العودة إلى الأدلة`)
};

/**
* | output |
* | --- |
* | "Back to Guides" |
*
* @param {Developerportal_Guides_Page_Backtoguides3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_page_backtoguides3 = /** @type {((inputs?: Developerportal_Guides_Page_Backtoguides3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Page_Backtoguides3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_page_backtoguides3(inputs)
	if (locale === "es") return es_developerportal_guides_page_backtoguides3(inputs)
	if (locale === "fr") return fr_developerportal_guides_page_backtoguides3(inputs)
	return ar_developerportal_guides_page_backtoguides3(inputs)
});
export { developerportal_guides_page_backtoguides3 as "developerPortal.guides.page.backToGuides" }