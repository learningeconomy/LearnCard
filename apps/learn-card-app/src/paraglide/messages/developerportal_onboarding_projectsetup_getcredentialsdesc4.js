/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Projectsetup_Getcredentialsdesc4Inputs */

const en_developerportal_onboarding_projectsetup_getcredentialsdesc4 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Getcredentialsdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your DID and API key for issuing credentials`)
};

const es_developerportal_onboarding_projectsetup_getcredentialsdesc4 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Getcredentialsdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tu DID y clave API para emitir credenciales`)
};

const fr_developerportal_onboarding_projectsetup_getcredentialsdesc4 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Getcredentialsdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Votre DID et clé API pour émettre des credentials`)
};

const ar_developerportal_onboarding_projectsetup_getcredentialsdesc4 = /** @type {(inputs: Developerportal_Onboarding_Projectsetup_Getcredentialsdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معرف DID الخاص بك ومفتاح API لإصدار بيانات الاعتماد`)
};

/**
* | output |
* | --- |
* | "Your DID and API key for issuing credentials" |
*
* @param {Developerportal_Onboarding_Projectsetup_Getcredentialsdesc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_projectsetup_getcredentialsdesc4 = /** @type {((inputs?: Developerportal_Onboarding_Projectsetup_Getcredentialsdesc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Projectsetup_Getcredentialsdesc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_projectsetup_getcredentialsdesc4(inputs)
	if (locale === "es") return es_developerportal_onboarding_projectsetup_getcredentialsdesc4(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_projectsetup_getcredentialsdesc4(inputs)
	return ar_developerportal_onboarding_projectsetup_getcredentialsdesc4(inputs)
});
export { developerportal_onboarding_projectsetup_getcredentialsdesc4 as "developerPortal.onboarding.projectSetup.getCredentialsDesc" }