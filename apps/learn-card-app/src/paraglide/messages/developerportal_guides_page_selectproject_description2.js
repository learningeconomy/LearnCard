/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Page_Selectproject_Description2Inputs */

const en_developerportal_guides_page_selectproject_description2 = /** @type {(inputs: Developerportal_Guides_Page_Selectproject_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choose a project from the dropdown above to continue with this guide.`)
};

const es_developerportal_guides_page_selectproject_description2 = /** @type {(inputs: Developerportal_Guides_Page_Selectproject_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Elige un proyecto del menú desplegable superior para continuar con esta guía.`)
};

const fr_developerportal_guides_page_selectproject_description2 = /** @type {(inputs: Developerportal_Guides_Page_Selectproject_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choisissez un projet dans le menu déroulant ci-dessus pour continuer avec ce guide.`)
};

const ar_developerportal_guides_page_selectproject_description2 = /** @type {(inputs: Developerportal_Guides_Page_Selectproject_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختر مشروعاً من القائمة المنسدلة أعلاه للمتابعة مع هذا الدليل.`)
};

/**
* | output |
* | --- |
* | "Choose a project from the dropdown above to continue with this guide." |
*
* @param {Developerportal_Guides_Page_Selectproject_Description2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_page_selectproject_description2 = /** @type {((inputs?: Developerportal_Guides_Page_Selectproject_Description2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Page_Selectproject_Description2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_page_selectproject_description2(inputs)
	if (locale === "es") return es_developerportal_guides_page_selectproject_description2(inputs)
	if (locale === "fr") return fr_developerportal_guides_page_selectproject_description2(inputs)
	return ar_developerportal_guides_page_selectproject_description2(inputs)
});
export { developerportal_guides_page_selectproject_description2 as "developerPortal.guides.page.selectProject.description" }