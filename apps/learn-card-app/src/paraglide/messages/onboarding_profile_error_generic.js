/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Profile_Error_GenericInputs */

const en_onboarding_profile_error_generic = /** @type {(inputs: Onboarding_Profile_Error_GenericInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Could not create your profile. You can still request parental consent now. Please try profile setup again later.`)
};

const es_onboarding_profile_error_generic = /** @type {(inputs: Onboarding_Profile_Error_GenericInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se pudo crear tu perfil. Aún puedes solicitar consentimiento parental ahora. Intenta configurar tu perfil más tarde.`)
};

const fr_onboarding_profile_error_generic = /** @type {(inputs: Onboarding_Profile_Error_GenericInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible de créer votre profil. Vous pouvez toujours demander le consentement parental maintenant. Veuillez réessayer la configuration du profil plus tard.`)
};

const ar_onboarding_profile_error_generic = /** @type {(inputs: Onboarding_Profile_Error_GenericInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذر إنشاء ملفك الشخصي. لا يزال بإمكانك طلب موافقة الوالدين الآن. يرجى محاولة إعداد الملف الشخصي لاحقاً.`)
};

/**
* | output |
* | --- |
* | "Could not create your profile. You can still request parental consent now. Please try profile setup again later." |
*
* @param {Onboarding_Profile_Error_GenericInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_profile_error_generic = /** @type {((inputs?: Onboarding_Profile_Error_GenericInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Profile_Error_GenericInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_profile_error_generic(inputs)
	if (locale === "es") return es_onboarding_profile_error_generic(inputs)
	if (locale === "fr") return fr_onboarding_profile_error_generic(inputs)
	return ar_onboarding_profile_error_generic(inputs)
});
export { onboarding_profile_error_generic as "onboarding.profile.error.generic" }