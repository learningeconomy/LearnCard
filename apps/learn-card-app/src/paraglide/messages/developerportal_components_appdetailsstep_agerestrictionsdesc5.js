/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Appdetailsstep_Agerestrictionsdesc5Inputs */

const en_developerportal_components_appdetailsstep_agerestrictionsdesc5 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Agerestrictionsdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Set age requirements for your app. Age Rating will display in the UI and requires guardian approval for underage child profiles. Minimum Age is a hard block that hides the app entirely.`)
};

const es_developerportal_components_appdetailsstep_agerestrictionsdesc5 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Agerestrictionsdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Set age requirements for your app. Age Rating will display in the UI and requires guardian approval for underage child profiles. Minimum Age is a hard block that hides the app entirely.`)
};

const fr_developerportal_components_appdetailsstep_agerestrictionsdesc5 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Agerestrictionsdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Set age requirements for your app. Age Rating will display in the UI and requires guardian approval for underage child profiles. Minimum Age is a hard block that hides the app entirely.`)
};

const ar_developerportal_components_appdetailsstep_agerestrictionsdesc5 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Agerestrictionsdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Set age requirements for your app. Age Rating will display in the UI and requires guardian approval for underage child profiles. Minimum Age is a hard block that hides the app entirely.`)
};

/**
* | output |
* | --- |
* | "Set age requirements for your app. Age Rating will display in the UI and requires guardian approval for underage child profiles. Minimum Age is a hard block ..." |
*
* @param {Developerportal_Components_Appdetailsstep_Agerestrictionsdesc5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_appdetailsstep_agerestrictionsdesc5 = /** @type {((inputs?: Developerportal_Components_Appdetailsstep_Agerestrictionsdesc5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Appdetailsstep_Agerestrictionsdesc5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_appdetailsstep_agerestrictionsdesc5(inputs)
	if (locale === "es") return es_developerportal_components_appdetailsstep_agerestrictionsdesc5(inputs)
	if (locale === "fr") return fr_developerportal_components_appdetailsstep_agerestrictionsdesc5(inputs)
	return ar_developerportal_components_appdetailsstep_agerestrictionsdesc5(inputs)
});
export { developerportal_components_appdetailsstep_agerestrictionsdesc5 as "developerPortal.components.appDetailsStep.ageRestrictionsDesc" }