/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Reviewstep_Notagline3Inputs */

const en_developerportal_components_reviewstep_notagline3 = /** @type {(inputs: Developerportal_Components_Reviewstep_Notagline3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No tagline provided`)
};

const es_developerportal_components_reviewstep_notagline3 = /** @type {(inputs: Developerportal_Components_Reviewstep_Notagline3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sin eslogan proporcionado`)
};

const fr_developerportal_components_reviewstep_notagline3 = /** @type {(inputs: Developerportal_Components_Reviewstep_Notagline3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun slogan fourni`)
};

const ar_developerportal_components_reviewstep_notagline3 = /** @type {(inputs: Developerportal_Components_Reviewstep_Notagline3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم يتم تقديم شعار`)
};

/**
* | output |
* | --- |
* | "No tagline provided" |
*
* @param {Developerportal_Components_Reviewstep_Notagline3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_reviewstep_notagline3 = /** @type {((inputs?: Developerportal_Components_Reviewstep_Notagline3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Reviewstep_Notagline3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_reviewstep_notagline3(inputs)
	if (locale === "es") return es_developerportal_components_reviewstep_notagline3(inputs)
	if (locale === "fr") return fr_developerportal_components_reviewstep_notagline3(inputs)
	return ar_developerportal_components_reviewstep_notagline3(inputs)
});
export { developerportal_components_reviewstep_notagline3 as "developerPortal.components.reviewStep.noTagline" }