/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Branding_Savedtoast2Inputs */

const en_developerportal_onboarding_branding_savedtoast2 = /** @type {(inputs: Developerportal_Onboarding_Branding_Savedtoast2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Profile updated successfully!`)
};

const es_developerportal_onboarding_branding_savedtoast2 = /** @type {(inputs: Developerportal_Onboarding_Branding_Savedtoast2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Perfil actualizado exitosamente!`)
};

const fr_developerportal_onboarding_branding_savedtoast2 = /** @type {(inputs: Developerportal_Onboarding_Branding_Savedtoast2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Profil mis à jour avec succès !`)
};

const ar_developerportal_onboarding_branding_savedtoast2 = /** @type {(inputs: Developerportal_Onboarding_Branding_Savedtoast2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم تحديث الملف الشخصي بنجاح!`)
};

/**
* | output |
* | --- |
* | "Profile updated successfully!" |
*
* @param {Developerportal_Onboarding_Branding_Savedtoast2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_branding_savedtoast2 = /** @type {((inputs?: Developerportal_Onboarding_Branding_Savedtoast2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Branding_Savedtoast2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_branding_savedtoast2(inputs)
	if (locale === "es") return es_developerportal_onboarding_branding_savedtoast2(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_branding_savedtoast2(inputs)
	return ar_developerportal_onboarding_branding_savedtoast2(inputs)
});
export { developerportal_onboarding_branding_savedtoast2 as "developerPortal.onboarding.branding.savedToast" }