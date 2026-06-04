/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Onboarding_Errorcreatingprofile2Inputs */

const en_toasts_onboarding_errorcreatingprofile2 = /** @type {(inputs: Toasts_Onboarding_Errorcreatingprofile2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error creating profile`)
};

const es_toasts_onboarding_errorcreatingprofile2 = /** @type {(inputs: Toasts_Onboarding_Errorcreatingprofile2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al crear perfil`)
};

const de_toasts_onboarding_errorcreatingprofile2 = /** @type {(inputs: Toasts_Onboarding_Errorcreatingprofile2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fehler beim Erstellen des Profils`)
};

const ar_toasts_onboarding_errorcreatingprofile2 = /** @type {(inputs: Toasts_Onboarding_Errorcreatingprofile2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`خطأ في إنشاء الملف الشخصي`)
};

const fr_toasts_onboarding_errorcreatingprofile2 = /** @type {(inputs: Toasts_Onboarding_Errorcreatingprofile2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Erreur lors de la création du profil`)
};

const ko_toasts_onboarding_errorcreatingprofile2 = /** @type {(inputs: Toasts_Onboarding_Errorcreatingprofile2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`프로필 생성 오류`)
};

/**
* | output |
* | --- |
* | "Error creating profile" |
*
* @param {Toasts_Onboarding_Errorcreatingprofile2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const toasts_onboarding_errorcreatingprofile2 = /** @type {((inputs?: Toasts_Onboarding_Errorcreatingprofile2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Onboarding_Errorcreatingprofile2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_onboarding_errorcreatingprofile2(inputs)
	if (locale === "es") return es_toasts_onboarding_errorcreatingprofile2(inputs)
	if (locale === "de") return de_toasts_onboarding_errorcreatingprofile2(inputs)
	if (locale === "ar") return ar_toasts_onboarding_errorcreatingprofile2(inputs)
	if (locale === "fr") return fr_toasts_onboarding_errorcreatingprofile2(inputs)
	return ko_toasts_onboarding_errorcreatingprofile2(inputs)
});
export { toasts_onboarding_errorcreatingprofile2 as "toasts.onboarding.errorCreatingProfile" }