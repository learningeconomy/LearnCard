/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Datamapping_Credentialnotfounddesc5Inputs */

const en_developerportal_onboarding_datamapping_credentialnotfounddesc5 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Credentialnotfounddesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Make sure you ran your code.`)
};

const es_developerportal_onboarding_datamapping_credentialnotfounddesc5 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Credentialnotfounddesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Asegúrate de haber ejecutado tu código.`)
};

const fr_developerportal_onboarding_datamapping_credentialnotfounddesc5 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Credentialnotfounddesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Assurez-vous d'avoir exécuté votre code.`)
};

const ar_developerportal_onboarding_datamapping_credentialnotfounddesc5 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Credentialnotfounddesc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تأكد من تشغيل الكود الخاص بك.`)
};

/**
* | output |
* | --- |
* | "Make sure you ran your code." |
*
* @param {Developerportal_Onboarding_Datamapping_Credentialnotfounddesc5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_datamapping_credentialnotfounddesc5 = /** @type {((inputs?: Developerportal_Onboarding_Datamapping_Credentialnotfounddesc5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Datamapping_Credentialnotfounddesc5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_datamapping_credentialnotfounddesc5(inputs)
	if (locale === "es") return es_developerportal_onboarding_datamapping_credentialnotfounddesc5(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_datamapping_credentialnotfounddesc5(inputs)
	return ar_developerportal_onboarding_datamapping_credentialnotfounddesc5(inputs)
});
export { developerportal_onboarding_datamapping_credentialnotfounddesc5 as "developerPortal.onboarding.dataMapping.credentialNotFoundDesc" }