/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Consentflow_Teststep_Vpdesc4Inputs */

const en_developerportal_guides_consentflow_teststep_vpdesc4 = /** @type {(inputs: Developerportal_Guides_Consentflow_Teststep_Vpdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`A VP JWT containing a delegate credential. This proves the user authorized your app to act on their behalf for this contract.`)
};

const es_developerportal_guides_consentflow_teststep_vpdesc4 = /** @type {(inputs: Developerportal_Guides_Consentflow_Teststep_Vpdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Un VP JWT que contiene una credencial delegada. Esto demuestra que el usuario autorizó a tu aplicación a actuar en su nombre para este contrato.`)
};

const fr_developerportal_guides_consentflow_teststep_vpdesc4 = /** @type {(inputs: Developerportal_Guides_Consentflow_Teststep_Vpdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Un VP JWT contenant un certificat délégué. Cela prouve que l'utilisateur a autorisé votre application à agir en son nom pour ce contrat.`)
};

const ar_developerportal_guides_consentflow_teststep_vpdesc4 = /** @type {(inputs: Developerportal_Guides_Consentflow_Teststep_Vpdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`VP JWT يحتوي على مؤهل مفوض. هذا يثبت أن المستخدم سمح لتطبيقك بالعمل نيابة عنه لهذا العقد.`)
};

/**
* | output |
* | --- |
* | "A VP JWT containing a delegate credential. This proves the user authorized your app to act on their behalf for this contract." |
*
* @param {Developerportal_Guides_Consentflow_Teststep_Vpdesc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_consentflow_teststep_vpdesc4 = /** @type {((inputs?: Developerportal_Guides_Consentflow_Teststep_Vpdesc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Consentflow_Teststep_Vpdesc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_consentflow_teststep_vpdesc4(inputs)
	if (locale === "es") return es_developerportal_guides_consentflow_teststep_vpdesc4(inputs)
	if (locale === "fr") return fr_developerportal_guides_consentflow_teststep_vpdesc4(inputs)
	return ar_developerportal_guides_consentflow_teststep_vpdesc4(inputs)
});
export { developerportal_guides_consentflow_teststep_vpdesc4 as "developerPortal.guides.consentFlow.testStep.vpDesc" }