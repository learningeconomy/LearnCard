/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Signingauthority_Createbutton3Inputs */

const en_developerportal_onboarding_signingauthority_createbutton3 = /** @type {(inputs: Developerportal_Onboarding_Signingauthority_Createbutton3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create Signing Authority`)
};

const es_developerportal_onboarding_signingauthority_createbutton3 = /** @type {(inputs: Developerportal_Onboarding_Signingauthority_Createbutton3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crear Autoridad de Firma`)
};

const fr_developerportal_onboarding_signingauthority_createbutton3 = /** @type {(inputs: Developerportal_Onboarding_Signingauthority_Createbutton3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créer une Autorité de Signature`)
};

const ar_developerportal_onboarding_signingauthority_createbutton3 = /** @type {(inputs: Developerportal_Onboarding_Signingauthority_Createbutton3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء سلطة توقيع`)
};

/**
* | output |
* | --- |
* | "Create Signing Authority" |
*
* @param {Developerportal_Onboarding_Signingauthority_Createbutton3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_signingauthority_createbutton3 = /** @type {((inputs?: Developerportal_Onboarding_Signingauthority_Createbutton3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Signingauthority_Createbutton3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_signingauthority_createbutton3(inputs)
	if (locale === "es") return es_developerportal_onboarding_signingauthority_createbutton3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_signingauthority_createbutton3(inputs)
	return ar_developerportal_onboarding_signingauthority_createbutton3(inputs)
});
export { developerportal_onboarding_signingauthority_createbutton3 as "developerPortal.onboarding.signingAuthority.createButton" }