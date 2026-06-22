/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Reviewstep_Title2Inputs */

const en_developerportal_components_reviewstep_title2 = /** @type {(inputs: Developerportal_Components_Reviewstep_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Review Your Submission`)
};

const es_developerportal_components_reviewstep_title2 = /** @type {(inputs: Developerportal_Components_Reviewstep_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Revisa Tu Envío`)
};

const fr_developerportal_components_reviewstep_title2 = /** @type {(inputs: Developerportal_Components_Reviewstep_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Révisez Votre Soumission`)
};

const ar_developerportal_components_reviewstep_title2 = /** @type {(inputs: Developerportal_Components_Reviewstep_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`راجع إرسالك`)
};

/**
* | output |
* | --- |
* | "Review Your Submission" |
*
* @param {Developerportal_Components_Reviewstep_Title2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_reviewstep_title2 = /** @type {((inputs?: Developerportal_Components_Reviewstep_Title2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Reviewstep_Title2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_reviewstep_title2(inputs)
	if (locale === "es") return es_developerportal_components_reviewstep_title2(inputs)
	if (locale === "fr") return fr_developerportal_components_reviewstep_title2(inputs)
	return ar_developerportal_components_reviewstep_title2(inputs)
});
export { developerportal_components_reviewstep_title2 as "developerPortal.components.reviewStep.title" }