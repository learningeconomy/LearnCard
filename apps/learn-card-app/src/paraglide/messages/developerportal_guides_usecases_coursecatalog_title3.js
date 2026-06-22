/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Usecases_Coursecatalog_Title3Inputs */

const en_developerportal_guides_usecases_coursecatalog_title3 = /** @type {(inputs: Developerportal_Guides_Usecases_Coursecatalog_Title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connect Course Catalog`)
};

const es_developerportal_guides_usecases_coursecatalog_title3 = /** @type {(inputs: Developerportal_Guides_Usecases_Coursecatalog_Title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connect Course Catalog`)
};

const fr_developerportal_guides_usecases_coursecatalog_title3 = /** @type {(inputs: Developerportal_Guides_Usecases_Coursecatalog_Title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connect Course Catalog`)
};

const ar_developerportal_guides_usecases_coursecatalog_title3 = /** @type {(inputs: Developerportal_Guides_Usecases_Coursecatalog_Title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connect Course Catalog`)
};

/**
* | output |
* | --- |
* | "Connect Course Catalog" |
*
* @param {Developerportal_Guides_Usecases_Coursecatalog_Title3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_usecases_coursecatalog_title3 = /** @type {((inputs?: Developerportal_Guides_Usecases_Coursecatalog_Title3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Usecases_Coursecatalog_Title3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_usecases_coursecatalog_title3(inputs)
	if (locale === "es") return es_developerportal_guides_usecases_coursecatalog_title3(inputs)
	if (locale === "fr") return fr_developerportal_guides_usecases_coursecatalog_title3(inputs)
	return ar_developerportal_guides_usecases_coursecatalog_title3(inputs)
});
export { developerportal_guides_usecases_coursecatalog_title3 as "developerPortal.guides.useCases.courseCatalog.title" }