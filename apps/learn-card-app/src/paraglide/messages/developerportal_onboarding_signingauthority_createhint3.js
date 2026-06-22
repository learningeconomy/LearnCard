/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Signingauthority_Createhint3Inputs */

const en_developerportal_onboarding_signingauthority_createhint3 = /** @type {(inputs: Developerportal_Onboarding_Signingauthority_Createhint3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create one to sign credentials`)
};

const es_developerportal_onboarding_signingauthority_createhint3 = /** @type {(inputs: Developerportal_Onboarding_Signingauthority_Createhint3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crea una para firmar credenciales`)
};

const fr_developerportal_onboarding_signingauthority_createhint3 = /** @type {(inputs: Developerportal_Onboarding_Signingauthority_Createhint3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créez-en une pour signer les credentials`)
};

const ar_developerportal_onboarding_signingauthority_createhint3 = /** @type {(inputs: Developerportal_Onboarding_Signingauthority_Createhint3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أنشئ واحدة لتوقيع بيانات الاعتماد`)
};

/**
* | output |
* | --- |
* | "Create one to sign credentials" |
*
* @param {Developerportal_Onboarding_Signingauthority_Createhint3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_signingauthority_createhint3 = /** @type {((inputs?: Developerportal_Onboarding_Signingauthority_Createhint3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Signingauthority_Createhint3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_signingauthority_createhint3(inputs)
	if (locale === "es") return es_developerportal_onboarding_signingauthority_createhint3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_signingauthority_createhint3(inputs)
	return ar_developerportal_onboarding_signingauthority_createhint3(inputs)
});
export { developerportal_onboarding_signingauthority_createhint3 as "developerPortal.onboarding.signingAuthority.createHint" }