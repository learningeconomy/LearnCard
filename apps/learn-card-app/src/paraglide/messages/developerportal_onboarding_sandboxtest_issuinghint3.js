/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Sandboxtest_Issuinghint3Inputs */

const en_developerportal_onboarding_sandboxtest_issuinghint3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Issuinghint3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This should only take a moment`)
};

const es_developerportal_onboarding_sandboxtest_issuinghint3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Issuinghint3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Esto solo tomará un momento`)
};

const fr_developerportal_onboarding_sandboxtest_issuinghint3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Issuinghint3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cela ne devrait prendre qu'un instant`)
};

const ar_developerportal_onboarding_sandboxtest_issuinghint3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Issuinghint3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يجب أن يستغرق هذا لحظة فقط`)
};

/**
* | output |
* | --- |
* | "This should only take a moment" |
*
* @param {Developerportal_Onboarding_Sandboxtest_Issuinghint3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_sandboxtest_issuinghint3 = /** @type {((inputs?: Developerportal_Onboarding_Sandboxtest_Issuinghint3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Sandboxtest_Issuinghint3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_sandboxtest_issuinghint3(inputs)
	if (locale === "es") return es_developerportal_onboarding_sandboxtest_issuinghint3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_sandboxtest_issuinghint3(inputs)
	return ar_developerportal_onboarding_sandboxtest_issuinghint3(inputs)
});
export { developerportal_onboarding_sandboxtest_issuinghint3 as "developerPortal.onboarding.sandboxTest.issuingHint" }