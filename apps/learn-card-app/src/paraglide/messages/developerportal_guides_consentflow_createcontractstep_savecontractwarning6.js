/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Consentflow_Createcontractstep_Savecontractwarning6Inputs */

const en_developerportal_guides_consentflow_createcontractstep_savecontractwarning6 = /** @type {(inputs: Developerportal_Guides_Consentflow_Createcontractstep_Savecontractwarning6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Important: Save this Contract URI — you'll need it to send credentials later.`)
};

const es_developerportal_guides_consentflow_createcontractstep_savecontractwarning6 = /** @type {(inputs: Developerportal_Guides_Consentflow_Createcontractstep_Savecontractwarning6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Importante: Guarda esta URI del Contrato — la necesitarás para enviar credenciales más tarde.`)
};

const fr_developerportal_guides_consentflow_createcontractstep_savecontractwarning6 = /** @type {(inputs: Developerportal_Guides_Consentflow_Createcontractstep_Savecontractwarning6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Important : Enregistrez cette URI de Contrat — vous en aurez besoin pour envoyer des certificats plus tard.`)
};

const ar_developerportal_guides_consentflow_createcontractstep_savecontractwarning6 = /** @type {(inputs: Developerportal_Guides_Consentflow_Createcontractstep_Savecontractwarning6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مهم: احفظ URI العقد هذا — ستحتاجه لإرسال المؤهلات لاحقاً.`)
};

/**
* | output |
* | --- |
* | "Important: Save this Contract URI — you'll need it to send credentials later." |
*
* @param {Developerportal_Guides_Consentflow_Createcontractstep_Savecontractwarning6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_consentflow_createcontractstep_savecontractwarning6 = /** @type {((inputs?: Developerportal_Guides_Consentflow_Createcontractstep_Savecontractwarning6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Consentflow_Createcontractstep_Savecontractwarning6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_consentflow_createcontractstep_savecontractwarning6(inputs)
	if (locale === "es") return es_developerportal_guides_consentflow_createcontractstep_savecontractwarning6(inputs)
	if (locale === "fr") return fr_developerportal_guides_consentflow_createcontractstep_savecontractwarning6(inputs)
	return ar_developerportal_guides_consentflow_createcontractstep_savecontractwarning6(inputs)
});
export { developerportal_guides_consentflow_createcontractstep_savecontractwarning6 as "developerPortal.guides.consentFlow.createContractStep.saveContractWarning" }