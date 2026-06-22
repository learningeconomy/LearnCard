/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Templatebuilder_Nodescription3Inputs */

const en_developerportal_onboarding_templatebuilder_nodescription3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Nodescription3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No description`)
};

const es_developerportal_onboarding_templatebuilder_nodescription3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Nodescription3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sin descripción`)
};

const fr_developerportal_onboarding_templatebuilder_nodescription3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Nodescription3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune description`)
};

const ar_developerportal_onboarding_templatebuilder_nodescription3 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Nodescription3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا يوجد وصف`)
};

/**
* | output |
* | --- |
* | "No description" |
*
* @param {Developerportal_Onboarding_Templatebuilder_Nodescription3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_templatebuilder_nodescription3 = /** @type {((inputs?: Developerportal_Onboarding_Templatebuilder_Nodescription3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Templatebuilder_Nodescription3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_templatebuilder_nodescription3(inputs)
	if (locale === "es") return es_developerportal_onboarding_templatebuilder_nodescription3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_templatebuilder_nodescription3(inputs)
	return ar_developerportal_onboarding_templatebuilder_nodescription3(inputs)
});
export { developerportal_onboarding_templatebuilder_nodescription3 as "developerPortal.onboarding.templateBuilder.noDescription" }