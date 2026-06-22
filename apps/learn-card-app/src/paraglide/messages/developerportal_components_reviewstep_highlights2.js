/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Reviewstep_Highlights2Inputs */

const en_developerportal_components_reviewstep_highlights2 = /** @type {(inputs: Developerportal_Components_Reviewstep_Highlights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Highlights`)
};

const es_developerportal_components_reviewstep_highlights2 = /** @type {(inputs: Developerportal_Components_Reviewstep_Highlights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Destacados`)
};

const fr_developerportal_components_reviewstep_highlights2 = /** @type {(inputs: Developerportal_Components_Reviewstep_Highlights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Points Forts`)
};

const ar_developerportal_components_reviewstep_highlights2 = /** @type {(inputs: Developerportal_Components_Reviewstep_Highlights2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أبرز الميزات`)
};

/**
* | output |
* | --- |
* | "Highlights" |
*
* @param {Developerportal_Components_Reviewstep_Highlights2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_reviewstep_highlights2 = /** @type {((inputs?: Developerportal_Components_Reviewstep_Highlights2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Reviewstep_Highlights2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_reviewstep_highlights2(inputs)
	if (locale === "es") return es_developerportal_components_reviewstep_highlights2(inputs)
	if (locale === "fr") return fr_developerportal_components_reviewstep_highlights2(inputs)
	return ar_developerportal_components_reviewstep_highlights2(inputs)
});
export { developerportal_components_reviewstep_highlights2 as "developerPortal.components.reviewStep.highlights" }