/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Integrationmethod_Featureprogrammatic3Inputs */

const en_developerportal_onboarding_integrationmethod_featureprogrammatic3 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Featureprogrammatic3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Complete programmatic control`)
};

const es_developerportal_onboarding_integrationmethod_featureprogrammatic3 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Featureprogrammatic3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Control programático completo`)
};

const fr_developerportal_onboarding_integrationmethod_featureprogrammatic3 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Featureprogrammatic3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contrôle programmatique complet`)
};

const ar_developerportal_onboarding_integrationmethod_featureprogrammatic3 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Featureprogrammatic3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحكم برمجي كامل`)
};

/**
* | output |
* | --- |
* | "Complete programmatic control" |
*
* @param {Developerportal_Onboarding_Integrationmethod_Featureprogrammatic3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_integrationmethod_featureprogrammatic3 = /** @type {((inputs?: Developerportal_Onboarding_Integrationmethod_Featureprogrammatic3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Integrationmethod_Featureprogrammatic3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_integrationmethod_featureprogrammatic3(inputs)
	if (locale === "es") return es_developerportal_onboarding_integrationmethod_featureprogrammatic3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_integrationmethod_featureprogrammatic3(inputs)
	return ar_developerportal_onboarding_integrationmethod_featureprogrammatic3(inputs)
});
export { developerportal_onboarding_integrationmethod_featureprogrammatic3 as "developerPortal.onboarding.integrationMethod.featureProgrammatic" }