/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Sandboxtest_Issuer2Inputs */

const en_developerportal_onboarding_sandboxtest_issuer2 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Issuer2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issuer`)
};

const es_developerportal_onboarding_sandboxtest_issuer2 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Issuer2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Emisor`)
};

const fr_developerportal_onboarding_sandboxtest_issuer2 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Issuer2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Émetteur`)
};

const ar_developerportal_onboarding_sandboxtest_issuer2 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Issuer2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المصدر`)
};

/**
* | output |
* | --- |
* | "Issuer" |
*
* @param {Developerportal_Onboarding_Sandboxtest_Issuer2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_sandboxtest_issuer2 = /** @type {((inputs?: Developerportal_Onboarding_Sandboxtest_Issuer2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Sandboxtest_Issuer2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_sandboxtest_issuer2(inputs)
	if (locale === "es") return es_developerportal_onboarding_sandboxtest_issuer2(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_sandboxtest_issuer2(inputs)
	return ar_developerportal_onboarding_sandboxtest_issuer2(inputs)
});
export { developerportal_onboarding_sandboxtest_issuer2 as "developerPortal.onboarding.sandboxTest.issuer" }