/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Templatebuilder_Csvissuancefields4Inputs */

const en_developerportal_onboarding_templatebuilder_csvissuancefields4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvissuancefields4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issuance Fields`)
};

const es_developerportal_onboarding_templatebuilder_csvissuancefields4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvissuancefields4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Campos de Emisión`)
};

const fr_developerportal_onboarding_templatebuilder_csvissuancefields4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvissuancefields4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Champs d'Émission`)
};

const ar_developerportal_onboarding_templatebuilder_csvissuancefields4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvissuancefields4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حقول الإصدار`)
};

/**
* | output |
* | --- |
* | "Issuance Fields" |
*
* @param {Developerportal_Onboarding_Templatebuilder_Csvissuancefields4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_templatebuilder_csvissuancefields4 = /** @type {((inputs?: Developerportal_Onboarding_Templatebuilder_Csvissuancefields4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Templatebuilder_Csvissuancefields4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_templatebuilder_csvissuancefields4(inputs)
	if (locale === "es") return es_developerportal_onboarding_templatebuilder_csvissuancefields4(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_templatebuilder_csvissuancefields4(inputs)
	return ar_developerportal_onboarding_templatebuilder_csvissuancefields4(inputs)
});
export { developerportal_onboarding_templatebuilder_csvissuancefields4 as "developerPortal.onboarding.templateBuilder.csvIssuanceFields" }