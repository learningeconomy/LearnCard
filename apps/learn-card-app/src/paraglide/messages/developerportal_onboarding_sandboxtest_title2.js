/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Sandboxtest_Title2Inputs */

const en_developerportal_onboarding_sandboxtest_title2 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sandbox Testing`)
};

const es_developerportal_onboarding_sandboxtest_title2 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pruebas en Sandbox`)
};

const fr_developerportal_onboarding_sandboxtest_title2 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tests en Bac à Sable`)
};

const ar_developerportal_onboarding_sandboxtest_title2 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختبار الحماية`)
};

/**
* | output |
* | --- |
* | "Sandbox Testing" |
*
* @param {Developerportal_Onboarding_Sandboxtest_Title2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_sandboxtest_title2 = /** @type {((inputs?: Developerportal_Onboarding_Sandboxtest_Title2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Sandboxtest_Title2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_sandboxtest_title2(inputs)
	if (locale === "es") return es_developerportal_onboarding_sandboxtest_title2(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_sandboxtest_title2(inputs)
	return ar_developerportal_onboarding_sandboxtest_title2(inputs)
});
export { developerportal_onboarding_sandboxtest_title2 as "developerPortal.onboarding.sandboxTest.title" }