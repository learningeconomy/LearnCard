/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Page_Selectproject_Title2Inputs */

const en_developerportal_guides_page_selectproject_title2 = /** @type {(inputs: Developerportal_Guides_Page_Selectproject_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select a Project`)
};

const es_developerportal_guides_page_selectproject_title2 = /** @type {(inputs: Developerportal_Guides_Page_Selectproject_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Seleccionar un Proyecto`)
};

const fr_developerportal_guides_page_selectproject_title2 = /** @type {(inputs: Developerportal_Guides_Page_Selectproject_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionner un Projet`)
};

const ar_developerportal_guides_page_selectproject_title2 = /** @type {(inputs: Developerportal_Guides_Page_Selectproject_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختيار مشروع`)
};

/**
* | output |
* | --- |
* | "Select a Project" |
*
* @param {Developerportal_Guides_Page_Selectproject_Title2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_page_selectproject_title2 = /** @type {((inputs?: Developerportal_Guides_Page_Selectproject_Title2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Page_Selectproject_Title2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_page_selectproject_title2(inputs)
	if (locale === "es") return es_developerportal_guides_page_selectproject_title2(inputs)
	if (locale === "fr") return fr_developerportal_guides_page_selectproject_title2(inputs)
	return ar_developerportal_guides_page_selectproject_title2(inputs)
});
export { developerportal_guides_page_selectproject_title2 as "developerPortal.guides.page.selectProject.title" }