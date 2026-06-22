/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Page_Selectproject_Noprojects3Inputs */

const en_developerportal_guides_page_selectproject_noprojects3 = /** @type {(inputs: Developerportal_Guides_Page_Selectproject_Noprojects3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You don't have any projects yet. Create one from the dropdown above.`)
};

const es_developerportal_guides_page_selectproject_noprojects3 = /** @type {(inputs: Developerportal_Guides_Page_Selectproject_Noprojects3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún no tienes proyectos. Crea uno desde el menú desplegable superior.`)
};

const fr_developerportal_guides_page_selectproject_noprojects3 = /** @type {(inputs: Developerportal_Guides_Page_Selectproject_Noprojects3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous n'avez pas encore de projet. Créez-en un depuis le menu déroulant ci-dessus.`)
};

const ar_developerportal_guides_page_selectproject_noprojects3 = /** @type {(inputs: Developerportal_Guides_Page_Selectproject_Noprojects3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ليس لديك أي مشاريع بعد. أنشئ واحداً من القائمة المنسدلة أعلاه.`)
};

/**
* | output |
* | --- |
* | "You don't have any projects yet. Create one from the dropdown above." |
*
* @param {Developerportal_Guides_Page_Selectproject_Noprojects3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_page_selectproject_noprojects3 = /** @type {((inputs?: Developerportal_Guides_Page_Selectproject_Noprojects3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Page_Selectproject_Noprojects3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_page_selectproject_noprojects3(inputs)
	if (locale === "es") return es_developerportal_guides_page_selectproject_noprojects3(inputs)
	if (locale === "fr") return fr_developerportal_guides_page_selectproject_noprojects3(inputs)
	return ar_developerportal_guides_page_selectproject_noprojects3(inputs)
});
export { developerportal_guides_page_selectproject_noprojects3 as "developerPortal.guides.page.selectProject.noProjects" }