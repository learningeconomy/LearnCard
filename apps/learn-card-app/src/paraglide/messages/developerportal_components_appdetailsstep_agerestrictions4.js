/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Appdetailsstep_Agerestrictions4Inputs */

const en_developerportal_components_appdetailsstep_agerestrictions4 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Agerestrictions4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Age Restrictions`)
};

const es_developerportal_components_appdetailsstep_agerestrictions4 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Agerestrictions4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Restricciones de Edad`)
};

const fr_developerportal_components_appdetailsstep_agerestrictions4 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Agerestrictions4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Restrictions d'Âge`)
};

const ar_developerportal_components_appdetailsstep_agerestrictions4 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Agerestrictions4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قيود العمر`)
};

/**
* | output |
* | --- |
* | "Age Restrictions" |
*
* @param {Developerportal_Components_Appdetailsstep_Agerestrictions4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_appdetailsstep_agerestrictions4 = /** @type {((inputs?: Developerportal_Components_Appdetailsstep_Agerestrictions4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Appdetailsstep_Agerestrictions4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_appdetailsstep_agerestrictions4(inputs)
	if (locale === "es") return es_developerportal_components_appdetailsstep_agerestrictions4(inputs)
	if (locale === "fr") return fr_developerportal_components_appdetailsstep_agerestrictions4(inputs)
	return ar_developerportal_components_appdetailsstep_agerestrictions4(inputs)
});
export { developerportal_components_appdetailsstep_agerestrictions4 as "developerPortal.components.appDetailsStep.ageRestrictions" }