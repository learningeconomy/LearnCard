/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Sandboxtest_Failedtitle3Inputs */

const en_developerportal_onboarding_sandboxtest_failedtitle3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Failedtitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Test Failed`)
};

const es_developerportal_onboarding_sandboxtest_failedtitle3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Failedtitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Prueba Fallida`)
};

const fr_developerportal_onboarding_sandboxtest_failedtitle3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Failedtitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Test Échoué`)
};

const ar_developerportal_onboarding_sandboxtest_failedtitle3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Failedtitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل الاختبار`)
};

/**
* | output |
* | --- |
* | "Test Failed" |
*
* @param {Developerportal_Onboarding_Sandboxtest_Failedtitle3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_sandboxtest_failedtitle3 = /** @type {((inputs?: Developerportal_Onboarding_Sandboxtest_Failedtitle3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Sandboxtest_Failedtitle3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_sandboxtest_failedtitle3(inputs)
	if (locale === "es") return es_developerportal_onboarding_sandboxtest_failedtitle3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_sandboxtest_failedtitle3(inputs)
	return ar_developerportal_onboarding_sandboxtest_failedtitle3(inputs)
});
export { developerportal_onboarding_sandboxtest_failedtitle3 as "developerPortal.onboarding.sandboxTest.failedTitle" }