/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Integrationmethod_Featurecustomlogic4Inputs */

const en_developerportal_onboarding_integrationmethod_featurecustomlogic4 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Featurecustomlogic4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Custom business logic`)
};

const es_developerportal_onboarding_integrationmethod_featurecustomlogic4 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Featurecustomlogic4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lógica de negocio personalizada`)
};

const fr_developerportal_onboarding_integrationmethod_featurecustomlogic4 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Featurecustomlogic4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Logique métier personnalisée`)
};

const ar_developerportal_onboarding_integrationmethod_featurecustomlogic4 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Featurecustomlogic4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`منطق أعمال مخصص`)
};

/**
* | output |
* | --- |
* | "Custom business logic" |
*
* @param {Developerportal_Onboarding_Integrationmethod_Featurecustomlogic4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_integrationmethod_featurecustomlogic4 = /** @type {((inputs?: Developerportal_Onboarding_Integrationmethod_Featurecustomlogic4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Integrationmethod_Featurecustomlogic4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_integrationmethod_featurecustomlogic4(inputs)
	if (locale === "es") return es_developerportal_onboarding_integrationmethod_featurecustomlogic4(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_integrationmethod_featurecustomlogic4(inputs)
	return ar_developerportal_onboarding_integrationmethod_featurecustomlogic4(inputs)
});
export { developerportal_onboarding_integrationmethod_featurecustomlogic4 as "developerPortal.onboarding.integrationMethod.featureCustomLogic" }