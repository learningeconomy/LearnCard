/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Templatebuilder_Untitledtemplate3Inputs */

const en_developerportal_onboarding_templatebuilder_untitledtemplate3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Untitledtemplate3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Untitled Template`)
};

const es_developerportal_onboarding_templatebuilder_untitledtemplate3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Untitledtemplate3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Plantilla sin Título`)
};

const fr_developerportal_onboarding_templatebuilder_untitledtemplate3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Untitledtemplate3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modèle sans Titre`)
};

const ar_developerportal_onboarding_templatebuilder_untitledtemplate3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Untitledtemplate3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قالب بدون عنوان`)
};

/**
* | output |
* | --- |
* | "Untitled Template" |
*
* @param {Developerportal_Onboarding_Templatebuilder_Untitledtemplate3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_templatebuilder_untitledtemplate3 = /** @type {((inputs?: Developerportal_Onboarding_Templatebuilder_Untitledtemplate3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Templatebuilder_Untitledtemplate3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_templatebuilder_untitledtemplate3(inputs)
	if (locale === "es") return es_developerportal_onboarding_templatebuilder_untitledtemplate3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_templatebuilder_untitledtemplate3(inputs)
	return ar_developerportal_onboarding_templatebuilder_untitledtemplate3(inputs)
});
export { developerportal_onboarding_templatebuilder_untitledtemplate3 as "developerPortal.onboarding.templateBuilder.untitledTemplate" }