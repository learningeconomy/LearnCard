/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Hub_Createproject_Description2Inputs */

const en_developerportal_guides_hub_createproject_description2 = /** @type {(inputs: Developerportal_Guides_Hub_Createproject_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Set up a project to start building your integration.`)
};

const es_developerportal_guides_hub_createproject_description2 = /** @type {(inputs: Developerportal_Guides_Hub_Createproject_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configura un proyecto para empezar a construir tu integración.`)
};

const fr_developerportal_guides_hub_createproject_description2 = /** @type {(inputs: Developerportal_Guides_Hub_Createproject_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configurez un projet pour commencer à construire votre intégration.`)
};

const ar_developerportal_guides_hub_createproject_description2 = /** @type {(inputs: Developerportal_Guides_Hub_Createproject_Description2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قم بإعداد مشروع لبدء بناء التكامل الخاص بك.`)
};

/**
* | output |
* | --- |
* | "Set up a project to start building your integration." |
*
* @param {Developerportal_Guides_Hub_Createproject_Description2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_hub_createproject_description2 = /** @type {((inputs?: Developerportal_Guides_Hub_Createproject_Description2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Hub_Createproject_Description2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_hub_createproject_description2(inputs)
	if (locale === "es") return es_developerportal_guides_hub_createproject_description2(inputs)
	if (locale === "fr") return fr_developerportal_guides_hub_createproject_description2(inputs)
	return ar_developerportal_guides_hub_createproject_description2(inputs)
});
export { developerportal_guides_hub_createproject_description2 as "developerPortal.guides.hub.createProject.description" }