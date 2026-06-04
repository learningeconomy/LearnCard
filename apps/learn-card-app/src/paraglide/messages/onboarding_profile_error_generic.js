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

const de_onboarding_profile_error_generic = /** @type {(inputs: Onboarding_Profile_Error_GenericInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Profil konnte nicht erstellt werden. Du kannst jetzt noch die elterliche Zustimmung anfordern. Bitte versuche die Profileinrichtung später erneut.`)
};

const ar_onboarding_profile_error_generic = /** @type {(inputs: Onboarding_Profile_Error_GenericInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذر إنشاء ملفك الشخصي. لا يزال بإمكانك طلب موافقة الوالدين الآن. يرجى محاولة إعداد الملف الشخصي لاحقاً.`)
};

const fr_onboarding_profile_error_generic = /** @type {(inputs: Onboarding_Profile_Error_GenericInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible de créer votre profil. Vous pouvez toujours demander le consentement parental maintenant. Veuillez réessayer la configuration du profil plus tard.`)
};

const ko_onboarding_profile_error_generic = /** @type {(inputs: Onboarding_Profile_Error_GenericInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`프로필을 만들 수 없습니다. 지금도 부모 동의를 요청할 수 있습니다. 나중에 프로필 설정을 다시 시도해 주세요.`)
};

/**
* | output |
* | --- |
* | "Could not create your profile. You can still request parental consent now. Please try profile setup again later." |
*
* @param {Onboarding_Profile_Error_GenericInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_profile_error_generic = /** @type {((inputs?: Onboarding_Profile_Error_GenericInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Profile_Error_GenericInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_profile_error_generic(inputs)
	if (locale === "es") return es_onboarding_profile_error_generic(inputs)
	if (locale === "de") return de_onboarding_profile_error_generic(inputs)
	if (locale === "ar") return ar_onboarding_profile_error_generic(inputs)
	if (locale === "fr") return fr_onboarding_profile_error_generic(inputs)
	return ko_onboarding_profile_error_generic(inputs)
});
export { onboarding_profile_error_generic as "onboarding.profile.error.generic" }