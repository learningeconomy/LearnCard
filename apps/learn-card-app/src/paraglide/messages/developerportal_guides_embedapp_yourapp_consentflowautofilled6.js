/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Yourapp_Consentflowautofilled6Inputs */

const en_developerportal_guides_embedapp_yourapp_consentflowautofilled6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Consentflowautofilled6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Auto-filled from your Request Data Consent setup.`)
};

const es_developerportal_guides_embedapp_yourapp_consentflowautofilled6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Consentflowautofilled6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Auto-filled from your Solicitar Consentimiento de Datos setup.`)
};

const fr_developerportal_guides_embedapp_yourapp_consentflowautofilled6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Consentflowautofilled6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Auto-filled from your Demander le Consentement des Données setup.`)
};

const ar_developerportal_guides_embedapp_yourapp_consentflowautofilled6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Yourapp_Consentflowautofilled6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Auto-filled from your طلب الموافقة على البيانات setup.`)
};

/**
* | output |
* | --- |
* | "Auto-filled from your Request Data Consent setup." |
*
* @param {Developerportal_Guides_Embedapp_Yourapp_Consentflowautofilled6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_yourapp_consentflowautofilled6 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Yourapp_Consentflowautofilled6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Yourapp_Consentflowautofilled6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_yourapp_consentflowautofilled6(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_yourapp_consentflowautofilled6(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_yourapp_consentflowautofilled6(inputs)
	return ar_developerportal_guides_embedapp_yourapp_consentflowautofilled6(inputs)
});
export { developerportal_guides_embedapp_yourapp_consentflowautofilled6 as "developerPortal.guides.embedApp.yourApp.consentFlowAutoFilled" }