/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Consentflow_Teststep_Step1title4Inputs */

const en_developerportal_guides_consentflow_teststep_step1title4 = /** @type {(inputs: Developerportal_Guides_Consentflow_Teststep_Step1title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Test the Consent Redirect`)
};

const es_developerportal_guides_consentflow_teststep_step1title4 = /** @type {(inputs: Developerportal_Guides_Consentflow_Teststep_Step1title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Probar la Redirección de Consentimiento`)
};

const fr_developerportal_guides_consentflow_teststep_step1title4 = /** @type {(inputs: Developerportal_Guides_Consentflow_Teststep_Step1title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tester la Redirection de Consentement`)
};

const ar_developerportal_guides_consentflow_teststep_step1title4 = /** @type {(inputs: Developerportal_Guides_Consentflow_Teststep_Step1title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختبار إعادة توجيه الموافقة`)
};

/**
* | output |
* | --- |
* | "Test the Consent Redirect" |
*
* @param {Developerportal_Guides_Consentflow_Teststep_Step1title4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_consentflow_teststep_step1title4 = /** @type {((inputs?: Developerportal_Guides_Consentflow_Teststep_Step1title4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Consentflow_Teststep_Step1title4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_consentflow_teststep_step1title4(inputs)
	if (locale === "es") return es_developerportal_guides_consentflow_teststep_step1title4(inputs)
	if (locale === "fr") return fr_developerportal_guides_consentflow_teststep_step1title4(inputs)
	return ar_developerportal_guides_consentflow_teststep_step1title4(inputs)
});
export { developerportal_guides_consentflow_teststep_step1title4 as "developerPortal.guides.consentFlow.testStep.step1Title" }