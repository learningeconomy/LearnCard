/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Reviewstep_Minimumage3Inputs */

const en_developerportal_components_reviewstep_minimumage3 = /** @type {(inputs: Developerportal_Components_Reviewstep_Minimumage3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Minimum Age`)
};

const es_developerportal_components_reviewstep_minimumage3 = /** @type {(inputs: Developerportal_Components_Reviewstep_Minimumage3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Edad Mínima`)
};

const fr_developerportal_components_reviewstep_minimumage3 = /** @type {(inputs: Developerportal_Components_Reviewstep_Minimumage3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Âge Minimum`)
};

const ar_developerportal_components_reviewstep_minimumage3 = /** @type {(inputs: Developerportal_Components_Reviewstep_Minimumage3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الحد الأدنى للعمر`)
};

/**
* | output |
* | --- |
* | "Minimum Age" |
*
* @param {Developerportal_Components_Reviewstep_Minimumage3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_reviewstep_minimumage3 = /** @type {((inputs?: Developerportal_Components_Reviewstep_Minimumage3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Reviewstep_Minimumage3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_reviewstep_minimumage3(inputs)
	if (locale === "es") return es_developerportal_components_reviewstep_minimumage3(inputs)
	if (locale === "fr") return fr_developerportal_components_reviewstep_minimumage3(inputs)
	return ar_developerportal_components_reviewstep_minimumage3(inputs)
});
export { developerportal_components_reviewstep_minimumage3 as "developerPortal.components.reviewStep.minimumAge" }