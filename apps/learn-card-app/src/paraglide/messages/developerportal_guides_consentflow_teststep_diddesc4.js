/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Consentflow_Teststep_Diddesc4Inputs */

const en_developerportal_guides_consentflow_teststep_diddesc4 = /** @type {(inputs: Developerportal_Guides_Consentflow_Teststep_Diddesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`The user's decentralized identifier (DID). Use this to send credentials to them.`)
};

const es_developerportal_guides_consentflow_teststep_diddesc4 = /** @type {(inputs: Developerportal_Guides_Consentflow_Teststep_Diddesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`El identificador descentralizado (DID) del usuario. Úsalo para enviarles credenciales.`)
};

const fr_developerportal_guides_consentflow_teststep_diddesc4 = /** @type {(inputs: Developerportal_Guides_Consentflow_Teststep_Diddesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`L'identifiant décentralisé (DID) de l'utilisateur. Utilisez-le pour lui envoyer des certificats.`)
};

const ar_developerportal_guides_consentflow_teststep_diddesc4 = /** @type {(inputs: Developerportal_Guides_Consentflow_Teststep_Diddesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المعرف اللامركزي (DID) للمستخدم. استخدمه لإرسال المؤهلات إليه.`)
};

/**
* | output |
* | --- |
* | "The user's decentralized identifier (DID). Use this to send credentials to them." |
*
* @param {Developerportal_Guides_Consentflow_Teststep_Diddesc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_consentflow_teststep_diddesc4 = /** @type {((inputs?: Developerportal_Guides_Consentflow_Teststep_Diddesc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Consentflow_Teststep_Diddesc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_consentflow_teststep_diddesc4(inputs)
	if (locale === "es") return es_developerportal_guides_consentflow_teststep_diddesc4(inputs)
	if (locale === "fr") return fr_developerportal_guides_consentflow_teststep_diddesc4(inputs)
	return ar_developerportal_guides_consentflow_teststep_diddesc4(inputs)
});
export { developerportal_guides_consentflow_teststep_diddesc4 as "developerPortal.guides.consentFlow.testStep.didDesc" }