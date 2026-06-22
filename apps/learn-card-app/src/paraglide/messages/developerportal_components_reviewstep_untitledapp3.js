/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Reviewstep_Untitledapp3Inputs */

const en_developerportal_components_reviewstep_untitledapp3 = /** @type {(inputs: Developerportal_Components_Reviewstep_Untitledapp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Untitled App`)
};

const es_developerportal_components_reviewstep_untitledapp3 = /** @type {(inputs: Developerportal_Components_Reviewstep_Untitledapp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`App sin título`)
};

const fr_developerportal_components_reviewstep_untitledapp3 = /** @type {(inputs: Developerportal_Components_Reviewstep_Untitledapp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Application sans titre`)
};

const ar_developerportal_components_reviewstep_untitledapp3 = /** @type {(inputs: Developerportal_Components_Reviewstep_Untitledapp3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تطبيق بدون عنوان`)
};

/**
* | output |
* | --- |
* | "Untitled App" |
*
* @param {Developerportal_Components_Reviewstep_Untitledapp3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_reviewstep_untitledapp3 = /** @type {((inputs?: Developerportal_Components_Reviewstep_Untitledapp3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Reviewstep_Untitledapp3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_reviewstep_untitledapp3(inputs)
	if (locale === "es") return es_developerportal_components_reviewstep_untitledapp3(inputs)
	if (locale === "fr") return fr_developerportal_components_reviewstep_untitledapp3(inputs)
	return ar_developerportal_components_reviewstep_untitledapp3(inputs)
});
export { developerportal_components_reviewstep_untitledapp3 as "developerPortal.components.reviewStep.untitledApp" }