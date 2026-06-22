/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Sandboxtest_Apiintegration3Inputs */

const en_developerportal_onboarding_sandboxtest_apiintegration3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Apiintegration3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`API Integration`)
};

const es_developerportal_onboarding_sandboxtest_apiintegration3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Apiintegration3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`API Integration`)
};

const fr_developerportal_onboarding_sandboxtest_apiintegration3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Apiintegration3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`API Integration`)
};

const ar_developerportal_onboarding_sandboxtest_apiintegration3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Apiintegration3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`API Integration`)
};

/**
* | output |
* | --- |
* | "API Integration" |
*
* @param {Developerportal_Onboarding_Sandboxtest_Apiintegration3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_sandboxtest_apiintegration3 = /** @type {((inputs?: Developerportal_Onboarding_Sandboxtest_Apiintegration3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Sandboxtest_Apiintegration3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_sandboxtest_apiintegration3(inputs)
	if (locale === "es") return es_developerportal_onboarding_sandboxtest_apiintegration3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_sandboxtest_apiintegration3(inputs)
	return ar_developerportal_onboarding_sandboxtest_apiintegration3(inputs)
});
export { developerportal_onboarding_sandboxtest_apiintegration3 as "developerPortal.onboarding.sandboxTest.apiIntegration" }