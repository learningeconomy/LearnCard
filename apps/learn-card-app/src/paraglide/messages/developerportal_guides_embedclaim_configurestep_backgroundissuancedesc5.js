/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedclaim_Configurestep_Backgroundissuancedesc5Inputs */

const en_developerportal_guides_embedclaim_configurestep_backgroundissuancedesc5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Backgroundissuancedesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ask the user for permission to issue future credentials without requiring email verification each time.`)
};

const es_developerportal_guides_embedclaim_configurestep_backgroundissuancedesc5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Backgroundissuancedesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pide al usuario permiso para emitir credenciales futuras sin requerir verificación de correo cada vez.`)
};

const fr_developerportal_guides_embedclaim_configurestep_backgroundissuancedesc5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Backgroundissuancedesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Demandez à l'utilisateur l'autorisation d'émettre de futurs certificats sans nécessiter de vérification par email à chaque fois.`)
};

const ar_developerportal_guides_embedclaim_configurestep_backgroundissuancedesc5 = /** @type {(inputs: Developerportal_Guides_Embedclaim_Configurestep_Backgroundissuancedesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اطلب من المستخدم الإذن لإصدار مؤهلات مستقبلية دون الحاجة إلى التحقق من البريد الإلكتروني في كل مرة.`)
};

/**
* | output |
* | --- |
* | "Ask the user for permission to issue future credentials without requiring email verification each time." |
*
* @param {Developerportal_Guides_Embedclaim_Configurestep_Backgroundissuancedesc5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedclaim_configurestep_backgroundissuancedesc5 = /** @type {((inputs?: Developerportal_Guides_Embedclaim_Configurestep_Backgroundissuancedesc5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedclaim_Configurestep_Backgroundissuancedesc5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedclaim_configurestep_backgroundissuancedesc5(inputs)
	if (locale === "es") return es_developerportal_guides_embedclaim_configurestep_backgroundissuancedesc5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedclaim_configurestep_backgroundissuancedesc5(inputs)
	return ar_developerportal_guides_embedclaim_configurestep_backgroundissuancedesc5(inputs)
});
export { developerportal_guides_embedclaim_configurestep_backgroundissuancedesc5 as "developerPortal.guides.embedClaim.configureStep.backgroundIssuanceDesc" }