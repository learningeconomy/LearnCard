/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Sandboxtest_Testpreview3Inputs */

const en_developerportal_onboarding_sandboxtest_testpreview3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Testpreview3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Test Credential Preview`)
};

const es_developerportal_onboarding_sandboxtest_testpreview3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Testpreview3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vista Previa de Credencial de Prueba`)
};

const fr_developerportal_onboarding_sandboxtest_testpreview3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Testpreview3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aperçu du Credential de Test`)
};

const ar_developerportal_onboarding_sandboxtest_testpreview3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Testpreview3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معاينة بيانات الاعتماد الاختبارية`)
};

/**
* | output |
* | --- |
* | "Test Credential Preview" |
*
* @param {Developerportal_Onboarding_Sandboxtest_Testpreview3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_sandboxtest_testpreview3 = /** @type {((inputs?: Developerportal_Onboarding_Sandboxtest_Testpreview3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Sandboxtest_Testpreview3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_sandboxtest_testpreview3(inputs)
	if (locale === "es") return es_developerportal_onboarding_sandboxtest_testpreview3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_sandboxtest_testpreview3(inputs)
	return ar_developerportal_onboarding_sandboxtest_testpreview3(inputs)
});
export { developerportal_onboarding_sandboxtest_testpreview3 as "developerPortal.onboarding.sandboxTest.testPreview" }