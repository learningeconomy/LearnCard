/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Sandboxtest_Successtitle3Inputs */

const en_developerportal_onboarding_sandboxtest_successtitle3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Successtitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Test Credential Issued!`)
};

const es_developerportal_onboarding_sandboxtest_successtitle3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Successtitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Credencial de Prueba Emitida!`)
};

const fr_developerportal_onboarding_sandboxtest_successtitle3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Successtitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credential de Test Émis !`)
};

const ar_developerportal_onboarding_sandboxtest_successtitle3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Successtitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم إصدار بيانات الاعتماد الاختبارية!`)
};

/**
* | output |
* | --- |
* | "Test Credential Issued!" |
*
* @param {Developerportal_Onboarding_Sandboxtest_Successtitle3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_sandboxtest_successtitle3 = /** @type {((inputs?: Developerportal_Onboarding_Sandboxtest_Successtitle3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Sandboxtest_Successtitle3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_sandboxtest_successtitle3(inputs)
	if (locale === "es") return es_developerportal_onboarding_sandboxtest_successtitle3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_sandboxtest_successtitle3(inputs)
	return ar_developerportal_onboarding_sandboxtest_successtitle3(inputs)
});
export { developerportal_onboarding_sandboxtest_successtitle3 as "developerPortal.onboarding.sandboxTest.successTitle" }