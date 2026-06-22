/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Sandboxtest_Sampledata3Inputs */

const en_developerportal_onboarding_sandboxtest_sampledata3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Sampledata3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sample Data`)
};

const es_developerportal_onboarding_sandboxtest_sampledata3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Sampledata3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Datos de Ejemplo`)
};

const fr_developerportal_onboarding_sandboxtest_sampledata3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Sampledata3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Données d'Exemple`)
};

const ar_developerportal_onboarding_sandboxtest_sampledata3 = /** @type {(inputs: Developerportal_Onboarding_Sandboxtest_Sampledata3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بيانات نموذجية`)
};

/**
* | output |
* | --- |
* | "Sample Data" |
*
* @param {Developerportal_Onboarding_Sandboxtest_Sampledata3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_sandboxtest_sampledata3 = /** @type {((inputs?: Developerportal_Onboarding_Sandboxtest_Sampledata3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Sandboxtest_Sampledata3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_sandboxtest_sampledata3(inputs)
	if (locale === "es") return es_developerportal_onboarding_sandboxtest_sampledata3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_sandboxtest_sampledata3(inputs)
	return ar_developerportal_onboarding_sandboxtest_sampledata3(inputs)
});
export { developerportal_onboarding_sandboxtest_sampledata3 as "developerPortal.onboarding.sandboxTest.sampleData" }