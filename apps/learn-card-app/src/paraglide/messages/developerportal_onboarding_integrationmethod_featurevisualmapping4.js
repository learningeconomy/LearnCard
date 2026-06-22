/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Integrationmethod_Featurevisualmapping4Inputs */

const en_developerportal_onboarding_integrationmethod_featurevisualmapping4 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Featurevisualmapping4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Visual field mapping tool`)
};

const es_developerportal_onboarding_integrationmethod_featurevisualmapping4 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Featurevisualmapping4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Herramienta de mapeo visual de campos`)
};

const fr_developerportal_onboarding_integrationmethod_featurevisualmapping4 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Featurevisualmapping4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Outil de mapping visuel des champs`)
};

const ar_developerportal_onboarding_integrationmethod_featurevisualmapping4 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Featurevisualmapping4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أداة تخطيط الحقول المرئية`)
};

/**
* | output |
* | --- |
* | "Visual field mapping tool" |
*
* @param {Developerportal_Onboarding_Integrationmethod_Featurevisualmapping4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_integrationmethod_featurevisualmapping4 = /** @type {((inputs?: Developerportal_Onboarding_Integrationmethod_Featurevisualmapping4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Integrationmethod_Featurevisualmapping4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_integrationmethod_featurevisualmapping4(inputs)
	if (locale === "es") return es_developerportal_onboarding_integrationmethod_featurevisualmapping4(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_integrationmethod_featurevisualmapping4(inputs)
	return ar_developerportal_onboarding_integrationmethod_featurevisualmapping4(inputs)
});
export { developerportal_onboarding_integrationmethod_featurevisualmapping4 as "developerPortal.onboarding.integrationMethod.featureVisualMapping" }