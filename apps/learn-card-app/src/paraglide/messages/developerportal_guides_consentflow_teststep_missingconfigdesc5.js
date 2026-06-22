/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Consentflow_Teststep_Missingconfigdesc5Inputs */

const en_developerportal_guides_consentflow_teststep_missingconfigdesc5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Teststep_Missingconfigdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Missing configuration: Go back and ensure you've set both a contract URI (Step 1) and callback URL (Step 2).`)
};

const es_developerportal_guides_consentflow_teststep_missingconfigdesc5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Teststep_Missingconfigdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configuración faltante: Regresa y asegúrate de haber configurado tanto la URI del contrato (Paso 1) como la URL de devolución (Paso 2).`)
};

const fr_developerportal_guides_consentflow_teststep_missingconfigdesc5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Teststep_Missingconfigdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configuration manquante : Revenez en arrière et assurez-vous d'avoir défini à la fois une URI de contrat (Étape 1) et une URL de rappel (Étape 2).`)
};

const ar_developerportal_guides_consentflow_teststep_missingconfigdesc5 = /** @type {(inputs: Developerportal_Guides_Consentflow_Teststep_Missingconfigdesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تكوين مفقود: عد للخلف وتأكد من تعيين كل من URI العقد (الخطوة 1) وعنوان URL الاستدعاء (الخطوة 2).`)
};

/**
* | output |
* | --- |
* | "Missing configuration: Go back and ensure you've set both a contract URI (Step 1) and callback URL (Step 2)." |
*
* @param {Developerportal_Guides_Consentflow_Teststep_Missingconfigdesc5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_consentflow_teststep_missingconfigdesc5 = /** @type {((inputs?: Developerportal_Guides_Consentflow_Teststep_Missingconfigdesc5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Consentflow_Teststep_Missingconfigdesc5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_consentflow_teststep_missingconfigdesc5(inputs)
	if (locale === "es") return es_developerportal_guides_consentflow_teststep_missingconfigdesc5(inputs)
	if (locale === "fr") return fr_developerportal_guides_consentflow_teststep_missingconfigdesc5(inputs)
	return ar_developerportal_guides_consentflow_teststep_missingconfigdesc5(inputs)
});
export { developerportal_guides_consentflow_teststep_missingconfigdesc5 as "developerPortal.guides.consentFlow.testStep.missingConfigDesc" }