/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Sandboxtest_Emailplaceholder3Inputs */

const en_developerportal_onboarding_sandboxtest_emailplaceholder3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Emailplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`you@company.com`)
};

const es_developerportal_onboarding_sandboxtest_emailplaceholder3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Emailplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`tu@empresa.com`)
};

const fr_developerportal_onboarding_sandboxtest_emailplaceholder3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Emailplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`vous@entreprise.com`)
};

const ar_developerportal_onboarding_sandboxtest_emailplaceholder3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Emailplaceholder3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أنت@شركة.com`)
};

/**
* | output |
* | --- |
* | "you@company.com" |
*
* @param {Developerportal_Onboarding_Sandboxtest_Emailplaceholder3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_sandboxtest_emailplaceholder3 = /** @type {((inputs?: Developerportal_Onboarding_Sandboxtest_Emailplaceholder3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Sandboxtest_Emailplaceholder3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_sandboxtest_emailplaceholder3(inputs)
	if (locale === "es") return es_developerportal_onboarding_sandboxtest_emailplaceholder3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_sandboxtest_emailplaceholder3(inputs)
	return ar_developerportal_onboarding_sandboxtest_emailplaceholder3(inputs)
});
export { developerportal_onboarding_sandboxtest_emailplaceholder3 as "developerPortal.onboarding.sandboxTest.emailPlaceholder" }