/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Sandboxtest_Integration2Inputs */

const en_developerportal_onboarding_sandboxtest_integration2 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Integration2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Integration`)
};

const es_developerportal_onboarding_sandboxtest_integration2 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Integration2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Integración`)
};

const fr_developerportal_onboarding_sandboxtest_integration2 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Integration2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Intégration`)
};

const ar_developerportal_onboarding_sandboxtest_integration2 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Integration2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التكامل`)
};

/**
* | output |
* | --- |
* | "Integration" |
*
* @param {Developerportal_Onboarding_Sandboxtest_Integration2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_sandboxtest_integration2 = /** @type {((inputs?: Developerportal_Onboarding_Sandboxtest_Integration2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Sandboxtest_Integration2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_sandboxtest_integration2(inputs)
	if (locale === "es") return es_developerportal_onboarding_sandboxtest_integration2(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_sandboxtest_integration2(inputs)
	return ar_developerportal_onboarding_sandboxtest_integration2(inputs)
});
export { developerportal_onboarding_sandboxtest_integration2 as "developerPortal.onboarding.sandboxTest.integration" }