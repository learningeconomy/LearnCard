/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Sandboxtest_Issuing2Inputs */

const en_developerportal_onboarding_sandboxtest_issuing2 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Issuing2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issuing Test Credential...`)
};

const es_developerportal_onboarding_sandboxtest_issuing2 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Issuing2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Emitiendo Credencial de Prueba...`)
};

const fr_developerportal_onboarding_sandboxtest_issuing2 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Issuing2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Émission du Credential de Test...`)
};

const ar_developerportal_onboarding_sandboxtest_issuing2 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Issuing2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري إصدار بيانات الاعتماد الاختبارية...`)
};

/**
* | output |
* | --- |
* | "Issuing Test Credential..." |
*
* @param {Developerportal_Onboarding_Sandboxtest_Issuing2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_sandboxtest_issuing2 = /** @type {((inputs?: Developerportal_Onboarding_Sandboxtest_Issuing2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Sandboxtest_Issuing2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_sandboxtest_issuing2(inputs)
	if (locale === "es") return es_developerportal_onboarding_sandboxtest_issuing2(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_sandboxtest_issuing2(inputs)
	return ar_developerportal_onboarding_sandboxtest_issuing2(inputs)
});
export { developerportal_onboarding_sandboxtest_issuing2 as "developerPortal.onboarding.sandboxTest.issuing" }