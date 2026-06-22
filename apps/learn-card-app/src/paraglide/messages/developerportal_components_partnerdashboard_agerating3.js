/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Partnerdashboard_Agerating3Inputs */

const en_developerportal_components_partnerdashboard_agerating3 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Agerating3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Age Rating`)
};

const es_developerportal_components_partnerdashboard_agerating3 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Agerating3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Clasificación por Edad`)
};

const fr_developerportal_components_partnerdashboard_agerating3 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Agerating3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Classification par Âge`)
};

const ar_developerportal_components_partnerdashboard_agerating3 = /** @type {(inputs: Developerportal_Components_Partnerdashboard_Agerating3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تصنيف العمري`)
};

/**
* | output |
* | --- |
* | "Age Rating" |
*
* @param {Developerportal_Components_Partnerdashboard_Agerating3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_partnerdashboard_agerating3 = /** @type {((inputs?: Developerportal_Components_Partnerdashboard_Agerating3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Partnerdashboard_Agerating3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_partnerdashboard_agerating3(inputs)
	if (locale === "es") return es_developerportal_components_partnerdashboard_agerating3(inputs)
	if (locale === "fr") return fr_developerportal_components_partnerdashboard_agerating3(inputs)
	return ar_developerportal_components_partnerdashboard_agerating3(inputs)
});
export { developerportal_components_partnerdashboard_agerating3 as "developerPortal.components.partnerDashboard.ageRating" }