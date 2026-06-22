/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Hub_Projectschoose2Inputs */

const en_developerportal_guides_hub_projectschoose2 = /** @type {(inputs: Developerportal_Guides_Hub_Projectschoose2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choose a project to continue building.`)
};

const es_developerportal_guides_hub_projectschoose2 = /** @type {(inputs: Developerportal_Guides_Hub_Projectschoose2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Elige un proyecto para continuar construyendo.`)
};

const fr_developerportal_guides_hub_projectschoose2 = /** @type {(inputs: Developerportal_Guides_Hub_Projectschoose2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choisissez un projet pour continuer à construire.`)
};

const ar_developerportal_guides_hub_projectschoose2 = /** @type {(inputs: Developerportal_Guides_Hub_Projectschoose2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختر مشروعاً لمواصلة البناء.`)
};

/**
* | output |
* | --- |
* | "Choose a project to continue building." |
*
* @param {Developerportal_Guides_Hub_Projectschoose2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_hub_projectschoose2 = /** @type {((inputs?: Developerportal_Guides_Hub_Projectschoose2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Hub_Projectschoose2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_hub_projectschoose2(inputs)
	if (locale === "es") return es_developerportal_guides_hub_projectschoose2(inputs)
	if (locale === "fr") return fr_developerportal_guides_hub_projectschoose2(inputs)
	return ar_developerportal_guides_hub_projectschoose2(inputs)
});
export { developerportal_guides_hub_projectschoose2 as "developerPortal.guides.hub.projectsChoose" }