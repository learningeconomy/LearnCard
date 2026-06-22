/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Integrationmethod_Nextsteps3Inputs */

const en_developerportal_onboarding_integrationmethod_nextsteps3 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Nextsteps3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Next Steps`)
};

const es_developerportal_onboarding_integrationmethod_nextsteps3 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Nextsteps3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Próximos Pasos`)
};

const fr_developerportal_onboarding_integrationmethod_nextsteps3 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Nextsteps3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Prochaines Étapes`)
};

const ar_developerportal_onboarding_integrationmethod_nextsteps3 = /** @type {(inputs: Developerportal_Onboarding_Integrationmethod_Nextsteps3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الخطوات التالية`)
};

/**
* | output |
* | --- |
* | "Next Steps" |
*
* @param {Developerportal_Onboarding_Integrationmethod_Nextsteps3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_integrationmethod_nextsteps3 = /** @type {((inputs?: Developerportal_Onboarding_Integrationmethod_Nextsteps3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Integrationmethod_Nextsteps3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_integrationmethod_nextsteps3(inputs)
	if (locale === "es") return es_developerportal_onboarding_integrationmethod_nextsteps3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_integrationmethod_nextsteps3(inputs)
	return ar_developerportal_onboarding_integrationmethod_nextsteps3(inputs)
});
export { developerportal_onboarding_integrationmethod_nextsteps3 as "developerPortal.onboarding.integrationMethod.nextSteps" }