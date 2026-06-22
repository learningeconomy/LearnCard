/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Templatebuilder_Csvautoinjected4Inputs */

const en_developerportal_onboarding_templatebuilder_csvautoinjected4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvautoinjected4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Auto-injected at issuance`)
};

const es_developerportal_onboarding_templatebuilder_csvautoinjected4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvautoinjected4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Inyectado automáticamente al emitir`)
};

const fr_developerportal_onboarding_templatebuilder_csvautoinjected4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvautoinjected4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Injecté automatiquement à l'émission`)
};

const ar_developerportal_onboarding_templatebuilder_csvautoinjected4 = /** @type {(inputs: Developerportal_Onboarding_Templatebuilder_Csvautoinjected4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`محقون تلقائياً عند الإصدار`)
};

/**
* | output |
* | --- |
* | "Auto-injected at issuance" |
*
* @param {Developerportal_Onboarding_Templatebuilder_Csvautoinjected4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_templatebuilder_csvautoinjected4 = /** @type {((inputs?: Developerportal_Onboarding_Templatebuilder_Csvautoinjected4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Templatebuilder_Csvautoinjected4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_templatebuilder_csvautoinjected4(inputs)
	if (locale === "es") return es_developerportal_onboarding_templatebuilder_csvautoinjected4(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_templatebuilder_csvautoinjected4(inputs)
	return ar_developerportal_onboarding_templatebuilder_csvautoinjected4(inputs)
});
export { developerportal_onboarding_templatebuilder_csvautoinjected4 as "developerPortal.onboarding.templateBuilder.csvAutoInjected" }