/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Integrationmethod_Recommended2Inputs */

const en_developerportal_onboarding_integrationmethod_recommended2 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Recommended2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recommended`)
};

const es_developerportal_onboarding_integrationmethod_recommended2 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Recommended2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recomendado`)
};

const fr_developerportal_onboarding_integrationmethod_recommended2 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Recommended2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recommandé`)
};

const ar_developerportal_onboarding_integrationmethod_recommended2 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Recommended2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`موصى به`)
};

/**
* | output |
* | --- |
* | "Recommended" |
*
* @param {Developerportal_Onboarding_Integrationmethod_Recommended2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_integrationmethod_recommended2 = /** @type {((inputs?: Developerportal_Onboarding_Integrationmethod_Recommended2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Integrationmethod_Recommended2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_integrationmethod_recommended2(inputs)
	if (locale === "es") return es_developerportal_onboarding_integrationmethod_recommended2(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_integrationmethod_recommended2(inputs)
	return ar_developerportal_onboarding_integrationmethod_recommended2(inputs)
});
export { developerportal_onboarding_integrationmethod_recommended2 as "developerPortal.onboarding.integrationMethod.recommended" }