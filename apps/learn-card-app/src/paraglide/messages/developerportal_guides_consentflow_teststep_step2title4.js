/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Consentflow_Teststep_Step2title4Inputs */

const en_developerportal_guides_consentflow_teststep_step2title4 = /** @type {(inputs: Developerportal_Guides_Consentflow_Teststep_Step2title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verify Callback Parameters`)
};

const es_developerportal_guides_consentflow_teststep_step2title4 = /** @type {(inputs: Developerportal_Guides_Consentflow_Teststep_Step2title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verificar Parámetros de Devolución`)
};

const fr_developerportal_guides_consentflow_teststep_step2title4 = /** @type {(inputs: Developerportal_Guides_Consentflow_Teststep_Step2title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vérifier les Paramètres de Rappel`)
};

const ar_developerportal_guides_consentflow_teststep_step2title4 = /** @type {(inputs: Developerportal_Guides_Consentflow_Teststep_Step2title4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التحقق من معلمات الاستدعاء`)
};

/**
* | output |
* | --- |
* | "Verify Callback Parameters" |
*
* @param {Developerportal_Guides_Consentflow_Teststep_Step2title4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_consentflow_teststep_step2title4 = /** @type {((inputs?: Developerportal_Guides_Consentflow_Teststep_Step2title4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Consentflow_Teststep_Step2title4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_consentflow_teststep_step2title4(inputs)
	if (locale === "es") return es_developerportal_guides_consentflow_teststep_step2title4(inputs)
	if (locale === "fr") return fr_developerportal_guides_consentflow_teststep_step2title4(inputs)
	return ar_developerportal_guides_consentflow_teststep_step2title4(inputs)
});
export { developerportal_guides_consentflow_teststep_step2title4 as "developerPortal.guides.consentFlow.testStep.step2Title" }