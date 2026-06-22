/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Sandboxtest_Logo2Inputs */

const en_developerportal_onboarding_sandboxtest_logo2 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Logo2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Logo`)
};

const es_developerportal_onboarding_sandboxtest_logo2 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Logo2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Logo`)
};

const fr_developerportal_onboarding_sandboxtest_logo2 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Logo2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Logo`)
};

const ar_developerportal_onboarding_sandboxtest_logo2 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Logo2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Logo`)
};

/**
* | output |
* | --- |
* | "Logo" |
*
* @param {Developerportal_Onboarding_Sandboxtest_Logo2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_sandboxtest_logo2 = /** @type {((inputs?: Developerportal_Onboarding_Sandboxtest_Logo2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Sandboxtest_Logo2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_sandboxtest_logo2(inputs)
	if (locale === "es") return es_developerportal_onboarding_sandboxtest_logo2(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_sandboxtest_logo2(inputs)
	return ar_developerportal_onboarding_sandboxtest_logo2(inputs)
});
export { developerportal_onboarding_sandboxtest_logo2 as "developerPortal.onboarding.sandboxTest.logo" }