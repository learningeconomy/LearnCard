/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Production_Activating1Inputs */

const en_developerportal_onboarding_production_activating1 = /** @type {(inputs: Developerportal_Onboarding_Production_Activating1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Activating...`)
};

const es_developerportal_onboarding_production_activating1 = /** @type {(inputs: Developerportal_Onboarding_Production_Activating1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Activando...`)
};

const fr_developerportal_onboarding_production_activating1 = /** @type {(inputs: Developerportal_Onboarding_Production_Activating1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Activation...`)
};

const ar_developerportal_onboarding_production_activating1 = /** @type {(inputs: Developerportal_Onboarding_Production_Activating1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري التفعيل...`)
};

/**
* | output |
* | --- |
* | "Activating..." |
*
* @param {Developerportal_Onboarding_Production_Activating1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_production_activating1 = /** @type {((inputs?: Developerportal_Onboarding_Production_Activating1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Production_Activating1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_production_activating1(inputs)
	if (locale === "es") return es_developerportal_onboarding_production_activating1(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_production_activating1(inputs)
	return ar_developerportal_onboarding_production_activating1(inputs)
});
export { developerportal_onboarding_production_activating1 as "developerPortal.onboarding.production.activating" }