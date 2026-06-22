/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Signingauthority_Benefit22Inputs */

const en_developerportal_onboarding_signingauthority_benefit22 = /** @type {(inputs: Developerportal_Onboarding_Signingauthority_Benefit22Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Registers the key with LearnCard's verification network`)
};

const es_developerportal_onboarding_signingauthority_benefit22 = /** @type {(inputs: Developerportal_Onboarding_Signingauthority_Benefit22Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Registra la clave en la red de verificación de LearnCard`)
};

const fr_developerportal_onboarding_signingauthority_benefit22 = /** @type {(inputs: Developerportal_Onboarding_Signingauthority_Benefit22Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enregistre la clé auprès du réseau de vérification LearnCard`)
};

const ar_developerportal_onboarding_signingauthority_benefit22 = /** @type {(inputs: Developerportal_Onboarding_Signingauthority_Benefit22Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يسجل المفتاح مع شبكة التحقق من LearnCard`)
};

/**
* | output |
* | --- |
* | "Registers the key with LearnCard's verification network" |
*
* @param {Developerportal_Onboarding_Signingauthority_Benefit22Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_signingauthority_benefit22 = /** @type {((inputs?: Developerportal_Onboarding_Signingauthority_Benefit22Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Signingauthority_Benefit22Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_signingauthority_benefit22(inputs)
	if (locale === "es") return es_developerportal_onboarding_signingauthority_benefit22(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_signingauthority_benefit22(inputs)
	return ar_developerportal_onboarding_signingauthority_benefit22(inputs)
});
export { developerportal_onboarding_signingauthority_benefit22 as "developerPortal.onboarding.signingAuthority.benefit2" }