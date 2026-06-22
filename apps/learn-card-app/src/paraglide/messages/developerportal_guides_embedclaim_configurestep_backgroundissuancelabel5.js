/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedclaim_Configurestep_Backgroundissuancelabel5Inputs */

const en_developerportal_guides_embedclaim_configurestep_backgroundissuancelabel5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Backgroundissuancelabel5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Request Background Issuance Consent`)
};

const es_developerportal_guides_embedclaim_configurestep_backgroundissuancelabel5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Backgroundissuancelabel5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Solicitar Consentimiento para Emisión en Segundo Plano`)
};

const fr_developerportal_guides_embedclaim_configurestep_backgroundissuancelabel5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Backgroundissuancelabel5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Demander le Consentement d'Émission en Arrière-plan`)
};

const ar_developerportal_guides_embedclaim_configurestep_backgroundissuancelabel5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Backgroundissuancelabel5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`طلب موافقة الإصدار في الخلفية`)
};

/**
* | output |
* | --- |
* | "Request Background Issuance Consent" |
*
* @param {Developerportal_Guides_Embedclaim_Configurestep_Backgroundissuancelabel5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_configurestep_backgroundissuancelabel5 = /** @type {((inputs?: Developerportal_Guides_Embedclaim_Configurestep_Backgroundissuancelabel5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Configurestep_Backgroundissuancelabel5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_configurestep_backgroundissuancelabel5(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_configurestep_backgroundissuancelabel5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_configurestep_backgroundissuancelabel5(inputs)
	return ar_developerportal_guides_embedclaim_configurestep_backgroundissuancelabel5(inputs)
});
export { developerportal_guides_embedclaim_configurestep_backgroundissuancelabel5 as "developerPortal.guides.embedClaim.configureStep.backgroundIssuanceLabel" }