/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Integrationmethod_Comingsoon3Inputs */

const en_developerportal_onboarding_integrationmethod_comingsoon3 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Comingsoon3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Coming Soon`)
};

const es_developerportal_onboarding_integrationmethod_comingsoon3 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Comingsoon3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Próximamente`)
};

const fr_developerportal_onboarding_integrationmethod_comingsoon3 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Comingsoon3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Prochainement`)
};

const ar_developerportal_onboarding_integrationmethod_comingsoon3 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Comingsoon3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قريباً`)
};

/**
* | output |
* | --- |
* | "Coming Soon" |
*
* @param {Developerportal_Onboarding_Integrationmethod_Comingsoon3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_integrationmethod_comingsoon3 = /** @type {((inputs?: Developerportal_Onboarding_Integrationmethod_Comingsoon3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Integrationmethod_Comingsoon3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_integrationmethod_comingsoon3(inputs)
	if (locale === "es") return es_developerportal_onboarding_integrationmethod_comingsoon3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_integrationmethod_comingsoon3(inputs)
	return ar_developerportal_onboarding_integrationmethod_comingsoon3(inputs)
});
export { developerportal_onboarding_integrationmethod_comingsoon3 as "developerPortal.onboarding.integrationMethod.comingSoon" }