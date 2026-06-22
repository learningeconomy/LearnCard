/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Developerportal_Onboarding_Sandboxtest_Morefields3Inputs */

const en_developerportal_onboarding_sandboxtest_morefields3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Morefields3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`+${i?.count} more`)
};

const es_developerportal_onboarding_sandboxtest_morefields3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Morefields3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`+${i?.count} más`)
};

const fr_developerportal_onboarding_sandboxtest_morefields3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Morefields3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`+${i?.count} de plus`)
};

const ar_developerportal_onboarding_sandboxtest_morefields3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Morefields3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`+${i?.count} أخرى`)
};

/**
* | output |
* | --- |
* | "+{count} more" |
*
* @param {Developerportal_Onboarding_Sandboxtest_Morefields3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_sandboxtest_morefields3 = /** @type {((inputs: Developerportal_Onboarding_Sandboxtest_Morefields3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Sandboxtest_Morefields3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_sandboxtest_morefields3(inputs)
	if (locale === "es") return es_developerportal_onboarding_sandboxtest_morefields3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_sandboxtest_morefields3(inputs)
	return ar_developerportal_onboarding_sandboxtest_morefields3(inputs)
});
export { developerportal_onboarding_sandboxtest_morefields3 as "developerPortal.onboarding.sandboxTest.moreFields" }