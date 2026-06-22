/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Consentflow_Teststep_Step3title4Inputs */

const en_developerportal_guides_consentflow_teststep_step3title4 = /** @type {(inputs: Developerportal_Guides_Consentflow_Teststep_Step3title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Test Credential Delivery`)
};

const es_developerportal_guides_consentflow_teststep_step3title4 = /** @type {(inputs: Developerportal_Guides_Consentflow_Teststep_Step3title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Probar Entrega de Credenciales`)
};

const fr_developerportal_guides_consentflow_teststep_step3title4 = /** @type {(inputs: Developerportal_Guides_Consentflow_Teststep_Step3title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tester la Livraison de Certificats`)
};

const ar_developerportal_guides_consentflow_teststep_step3title4 = /** @type {(inputs: Developerportal_Guides_Consentflow_Teststep_Step3title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختبار تسليم المؤهل`)
};

/**
* | output |
* | --- |
* | "Test Credential Delivery" |
*
* @param {Developerportal_Guides_Consentflow_Teststep_Step3title4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_consentflow_teststep_step3title4 = /** @type {((inputs?: Developerportal_Guides_Consentflow_Teststep_Step3title4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Consentflow_Teststep_Step3title4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_consentflow_teststep_step3title4(inputs)
	if (locale === "es") return es_developerportal_guides_consentflow_teststep_step3title4(inputs)
	if (locale === "fr") return fr_developerportal_guides_consentflow_teststep_step3title4(inputs)
	return ar_developerportal_guides_consentflow_teststep_step3title4(inputs)
});
export { developerportal_guides_consentflow_teststep_step3title4 as "developerPortal.guides.consentFlow.testStep.step3Title" }