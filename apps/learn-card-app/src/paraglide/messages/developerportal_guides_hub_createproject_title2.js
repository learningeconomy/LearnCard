/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Hub_Createproject_Title2Inputs */

const en_developerportal_guides_hub_createproject_title2 = /** @type {(inputs: Developerportal_Guides_Hub_Createproject_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create Your First Project`)
};

const es_developerportal_guides_hub_createproject_title2 = /** @type {(inputs: Developerportal_Guides_Hub_Createproject_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crea tu Primer Proyecto`)
};

const fr_developerportal_guides_hub_createproject_title2 = /** @type {(inputs: Developerportal_Guides_Hub_Createproject_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créez Votre Premier Projet`)
};

const ar_developerportal_guides_hub_createproject_title2 = /** @type {(inputs: Developerportal_Guides_Hub_Createproject_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أنشئ مشروعك الأول`)
};

/**
* | output |
* | --- |
* | "Create Your First Project" |
*
* @param {Developerportal_Guides_Hub_Createproject_Title2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_hub_createproject_title2 = /** @type {((inputs?: Developerportal_Guides_Hub_Createproject_Title2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Hub_Createproject_Title2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_hub_createproject_title2(inputs)
	if (locale === "es") return es_developerportal_guides_hub_createproject_title2(inputs)
	if (locale === "fr") return fr_developerportal_guides_hub_createproject_title2(inputs)
	return ar_developerportal_guides_hub_createproject_title2(inputs)
});
export { developerportal_guides_hub_createproject_title2 as "developerPortal.guides.hub.createProject.title" }