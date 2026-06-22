/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Templatebuilder_Nodynamicvars4Inputs */

const en_developerportal_onboarding_templatebuilder_nodynamicvars4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Nodynamicvars4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No dynamic variables`)
};

const es_developerportal_onboarding_templatebuilder_nodynamicvars4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Nodynamicvars4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sin variables dinámicas`)
};

const fr_developerportal_onboarding_templatebuilder_nodynamicvars4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Nodynamicvars4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune variable dynamique`)
};

const ar_developerportal_onboarding_templatebuilder_nodynamicvars4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Nodynamicvars4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد متغيرات ديناميكية`)
};

/**
* | output |
* | --- |
* | "No dynamic variables" |
*
* @param {Developerportal_Onboarding_Templatebuilder_Nodynamicvars4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_templatebuilder_nodynamicvars4 = /** @type {((inputs?: Developerportal_Onboarding_Templatebuilder_Nodynamicvars4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Templatebuilder_Nodynamicvars4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_templatebuilder_nodynamicvars4(inputs)
	if (locale === "es") return es_developerportal_onboarding_templatebuilder_nodynamicvars4(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_templatebuilder_nodynamicvars4(inputs)
	return ar_developerportal_onboarding_templatebuilder_nodynamicvars4(inputs)
});
export { developerportal_onboarding_templatebuilder_nodynamicvars4 as "developerPortal.onboarding.templateBuilder.noDynamicVars" }