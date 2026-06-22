/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Integrationmethod_Simplebatch3Inputs */

const en_developerportal_onboarding_integrationmethod_simplebatch3 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Simplebatch3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Simple batch import`)
};

const es_developerportal_onboarding_integrationmethod_simplebatch3 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Simplebatch3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Importación simple por lotes`)
};

const fr_developerportal_onboarding_integrationmethod_simplebatch3 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Simplebatch3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Import par lots simple`)
};

const ar_developerportal_onboarding_integrationmethod_simplebatch3 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Simplebatch3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استيراد دفعي بسيط`)
};

/**
* | output |
* | --- |
* | "Simple batch import" |
*
* @param {Developerportal_Onboarding_Integrationmethod_Simplebatch3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_integrationmethod_simplebatch3 = /** @type {((inputs?: Developerportal_Onboarding_Integrationmethod_Simplebatch3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Integrationmethod_Simplebatch3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_integrationmethod_simplebatch3(inputs)
	if (locale === "es") return es_developerportal_onboarding_integrationmethod_simplebatch3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_integrationmethod_simplebatch3(inputs)
	return ar_developerportal_onboarding_integrationmethod_simplebatch3(inputs)
});
export { developerportal_onboarding_integrationmethod_simplebatch3 as "developerPortal.onboarding.integrationMethod.simpleBatch" }