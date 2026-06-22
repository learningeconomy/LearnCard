/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Reviewstep_Notspecified3Inputs */

const en_developerportal_components_reviewstep_notspecified3 = /** @type {(inputs: Developerportal_Components_Reviewstep_Notspecified3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Not specified`)
};

const es_developerportal_components_reviewstep_notspecified3 = /** @type {(inputs: Developerportal_Components_Reviewstep_Notspecified3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No especificado`)
};

const fr_developerportal_components_reviewstep_notspecified3 = /** @type {(inputs: Developerportal_Components_Reviewstep_Notspecified3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Non spécifié`)
};

const ar_developerportal_components_reviewstep_notspecified3 = /** @type {(inputs: Developerportal_Components_Reviewstep_Notspecified3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`غير محدد`)
};

/**
* | output |
* | --- |
* | "Not specified" |
*
* @param {Developerportal_Components_Reviewstep_Notspecified3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_reviewstep_notspecified3 = /** @type {((inputs?: Developerportal_Components_Reviewstep_Notspecified3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Reviewstep_Notspecified3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_reviewstep_notspecified3(inputs)
	if (locale === "es") return es_developerportal_components_reviewstep_notspecified3(inputs)
	if (locale === "fr") return fr_developerportal_components_reviewstep_notspecified3(inputs)
	return ar_developerportal_components_reviewstep_notspecified3(inputs)
});
export { developerportal_components_reviewstep_notspecified3 as "developerPortal.components.reviewStep.notSpecified" }