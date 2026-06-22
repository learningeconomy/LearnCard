/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Consent_Underage_Addchild_Description1Inputs */

const en_onboarding_consent_underage_addchild_description1 = /** @type {(inputs: Onboarding_Consent_Underage_Addchild_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Log in or sign up to create your profile inside a family account.`)
};

const es_onboarding_consent_underage_addchild_description1 = /** @type {(inputs: Onboarding_Consent_Underage_Addchild_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Inicia sesión o regístrate para crear tu perfil dentro de una cuenta familiar.`)
};

const fr_onboarding_consent_underage_addchild_description1 = /** @type {(inputs: Onboarding_Consent_Underage_Addchild_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connectez-vous ou inscrivez-vous pour créer votre profil au sein d'un compte familial.`)
};

const ar_onboarding_consent_underage_addchild_description1 = /** @type {(inputs: Onboarding_Consent_Underage_Addchild_Description1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سجل الدخول أو اشترك لإنشاء ملفك الشخصي داخل حساب عائلي.`)
};

/**
* | output |
* | --- |
* | "Log in or sign up to create your profile inside a family account." |
*
* @param {Onboarding_Consent_Underage_Addchild_Description1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_consent_underage_addchild_description1 = /** @type {((inputs?: Onboarding_Consent_Underage_Addchild_Description1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Consent_Underage_Addchild_Description1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_consent_underage_addchild_description1(inputs)
	if (locale === "es") return es_onboarding_consent_underage_addchild_description1(inputs)
	if (locale === "fr") return fr_onboarding_consent_underage_addchild_description1(inputs)
	return ar_onboarding_consent_underage_addchild_description1(inputs)
});
export { onboarding_consent_underage_addchild_description1 as "onboarding.consent.underage.addChild.description" }