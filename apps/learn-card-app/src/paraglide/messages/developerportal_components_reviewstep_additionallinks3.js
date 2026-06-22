/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Reviewstep_Additionallinks3Inputs */

const en_developerportal_components_reviewstep_additionallinks3 = /** @type {(inputs: Developerportal_Components_Reviewstep_Additionallinks3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Additional Links`)
};

const es_developerportal_components_reviewstep_additionallinks3 = /** @type {(inputs: Developerportal_Components_Reviewstep_Additionallinks3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enlaces Adicionales`)
};

const fr_developerportal_components_reviewstep_additionallinks3 = /** @type {(inputs: Developerportal_Components_Reviewstep_Additionallinks3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Liens Supplémentaires`)
};

const ar_developerportal_components_reviewstep_additionallinks3 = /** @type {(inputs: Developerportal_Components_Reviewstep_Additionallinks3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`روابط إضافية`)
};

/**
* | output |
* | --- |
* | "Additional Links" |
*
* @param {Developerportal_Components_Reviewstep_Additionallinks3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_reviewstep_additionallinks3 = /** @type {((inputs?: Developerportal_Components_Reviewstep_Additionallinks3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Reviewstep_Additionallinks3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_reviewstep_additionallinks3(inputs)
	if (locale === "es") return es_developerportal_components_reviewstep_additionallinks3(inputs)
	if (locale === "fr") return fr_developerportal_components_reviewstep_additionallinks3(inputs)
	return ar_developerportal_components_reviewstep_additionallinks3(inputs)
});
export { developerportal_components_reviewstep_additionallinks3 as "developerPortal.components.reviewStep.additionalLinks" }