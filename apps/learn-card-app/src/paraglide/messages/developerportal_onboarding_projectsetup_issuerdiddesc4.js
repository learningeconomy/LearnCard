/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Projectsetup_Issuerdiddesc4Inputs */

const en_developerportal_onboarding_projectsetup_issuerdiddesc4 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Issuerdiddesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your decentralized identifier for signing credentials`)
};

const es_developerportal_onboarding_projectsetup_issuerdiddesc4 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Issuerdiddesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tu identificador descentralizado para firmar credenciales`)
};

const fr_developerportal_onboarding_projectsetup_issuerdiddesc4 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Issuerdiddesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Votre identifiant décentralisé pour signer les credentials`)
};

const ar_developerportal_onboarding_projectsetup_issuerdiddesc4 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Issuerdiddesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معرفك اللامركزي لتوقيع بيانات الاعتماد`)
};

/**
* | output |
* | --- |
* | "Your decentralized identifier for signing credentials" |
*
* @param {Developerportal_Onboarding_Projectsetup_Issuerdiddesc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_projectsetup_issuerdiddesc4 = /** @type {((inputs?: Developerportal_Onboarding_Projectsetup_Issuerdiddesc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Projectsetup_Issuerdiddesc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_projectsetup_issuerdiddesc4(inputs)
	if (locale === "es") return es_developerportal_onboarding_projectsetup_issuerdiddesc4(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_projectsetup_issuerdiddesc4(inputs)
	return ar_developerportal_onboarding_projectsetup_issuerdiddesc4(inputs)
});
export { developerportal_onboarding_projectsetup_issuerdiddesc4 as "developerPortal.onboarding.projectSetup.issuerDidDesc" }