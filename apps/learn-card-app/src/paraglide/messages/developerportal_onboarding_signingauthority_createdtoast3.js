/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Signingauthority_Createdtoast3Inputs */

const en_developerportal_onboarding_signingauthority_createdtoast3 = /** @type {(inputs: Developerportal_Onboarding_Signingauthority_Createdtoast3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Signing authority created!`)
};

const es_developerportal_onboarding_signingauthority_createdtoast3 = /** @type {(inputs: Developerportal_Onboarding_Signingauthority_Createdtoast3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Autoridad de firma creada!`)
};

const fr_developerportal_onboarding_signingauthority_createdtoast3 = /** @type {(inputs: Developerportal_Onboarding_Signingauthority_Createdtoast3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Autorité de signature créée !`)
};

const ar_developerportal_onboarding_signingauthority_createdtoast3 = /** @type {(inputs: Developerportal_Onboarding_Signingauthority_Createdtoast3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم إنشاء سلطة التوقيع!`)
};

/**
* | output |
* | --- |
* | "Signing authority created!" |
*
* @param {Developerportal_Onboarding_Signingauthority_Createdtoast3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_signingauthority_createdtoast3 = /** @type {((inputs?: Developerportal_Onboarding_Signingauthority_Createdtoast3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Signingauthority_Createdtoast3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_signingauthority_createdtoast3(inputs)
	if (locale === "es") return es_developerportal_onboarding_signingauthority_createdtoast3(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_signingauthority_createdtoast3(inputs)
	return ar_developerportal_onboarding_signingauthority_createdtoast3(inputs)
});
export { developerportal_onboarding_signingauthority_createdtoast3 as "developerPortal.onboarding.signingAuthority.createdToast" }