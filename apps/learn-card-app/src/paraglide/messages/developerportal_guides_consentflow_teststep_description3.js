/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Consentflow_Teststep_Description3Inputs */

const en_developerportal_guides_consentflow_teststep_description3 = /** @type {(inputs: Developerportal_Guides_Consentflow_Teststep_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verify your consent flow works end-to-end before going live.`)
};

const es_developerportal_guides_consentflow_teststep_description3 = /** @type {(inputs: Developerportal_Guides_Consentflow_Teststep_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verifica que tu flujo de consentimiento funcione de principio a fin antes de publicar.`)
};

const fr_developerportal_guides_consentflow_teststep_description3 = /** @type {(inputs: Developerportal_Guides_Consentflow_Teststep_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vérifiez que votre flux de consentement fonctionne de bout en bout avant la mise en ligne.`)
};

const ar_developerportal_guides_consentflow_teststep_description3 = /** @type {(inputs: Developerportal_Guides_Consentflow_Teststep_Description3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحقق من أن تدفق الموافقة يعمل بشكل كامل قبل النشر المباشر.`)
};

/**
* | output |
* | --- |
* | "Verify your consent flow works end-to-end before going live." |
*
* @param {Developerportal_Guides_Consentflow_Teststep_Description3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_consentflow_teststep_description3 = /** @type {((inputs?: Developerportal_Guides_Consentflow_Teststep_Description3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Consentflow_Teststep_Description3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_consentflow_teststep_description3(inputs)
	if (locale === "es") return es_developerportal_guides_consentflow_teststep_description3(inputs)
	if (locale === "fr") return fr_developerportal_guides_consentflow_teststep_description3(inputs)
	return ar_developerportal_guides_consentflow_teststep_description3(inputs)
});
export { developerportal_guides_consentflow_teststep_description3 as "developerPortal.guides.consentFlow.testStep.description" }