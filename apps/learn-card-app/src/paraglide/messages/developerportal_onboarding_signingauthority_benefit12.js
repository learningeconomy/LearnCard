/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Signingauthority_Benefit12Inputs */

const en_developerportal_onboarding_signingauthority_benefit12 = /** @type {(inputs: Developerportal_Onboarding_Signingauthority_Benefit12Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Creates a cryptographic key pair for signing`)
};

const es_developerportal_onboarding_signingauthority_benefit12 = /** @type {(inputs: Developerportal_Onboarding_Signingauthority_Benefit12Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crea un par de claves criptográficas para firmar`)
};

const fr_developerportal_onboarding_signingauthority_benefit12 = /** @type {(inputs: Developerportal_Onboarding_Signingauthority_Benefit12Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crée une paire de clés cryptographiques pour la signature`)
};

const ar_developerportal_onboarding_signingauthority_benefit12 = /** @type {(inputs: Developerportal_Onboarding_Signingauthority_Benefit12Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ينشئ زوج مفاتيح تشفير للتوقيع`)
};

/**
* | output |
* | --- |
* | "Creates a cryptographic key pair for signing" |
*
* @param {Developerportal_Onboarding_Signingauthority_Benefit12Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_signingauthority_benefit12 = /** @type {((inputs?: Developerportal_Onboarding_Signingauthority_Benefit12Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Signingauthority_Benefit12Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_signingauthority_benefit12(inputs)
	if (locale === "es") return es_developerportal_onboarding_signingauthority_benefit12(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_signingauthority_benefit12(inputs)
	return ar_developerportal_onboarding_signingauthority_benefit12(inputs)
});
export { developerportal_onboarding_signingauthority_benefit12 as "developerPortal.onboarding.signingAuthority.benefit1" }