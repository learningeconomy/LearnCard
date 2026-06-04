/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Profile_Privacynotice1Inputs */

const en_onboarding_profile_privacynotice1 = /** @type {(inputs: Onboarding_Profile_Privacynotice1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`We ask for your age and country to make sure we comply with privacy laws and keep you safe.`)
};

const es_onboarding_profile_privacynotice1 = /** @type {(inputs: Onboarding_Profile_Privacynotice1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pedimos tu edad y país para cumplir con las leyes de privacidad y mantenerte seguro.`)
};

const de_onboarding_profile_privacynotice1 = /** @type {(inputs: Onboarding_Profile_Privacynotice1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Wir fragen nach deinem Alter und Land, um die Datenschutzgesetze einzuhalten und dich zu schützen.`)
};

const ar_onboarding_profile_privacynotice1 = /** @type {(inputs: Onboarding_Profile_Privacynotice1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نطلب عمرك وبلدك للتأكد من امتثالنا لقوانين الخصوصية والحفاظ على سلامتك.`)
};

const fr_onboarding_profile_privacynotice1 = /** @type {(inputs: Onboarding_Profile_Privacynotice1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nous demandons votre âge et votre pays pour respecter les lois sur la confidentialité et vous protéger.`)
};

const ko_onboarding_profile_privacynotice1 = /** @type {(inputs: Onboarding_Profile_Privacynotice1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`개인정보 보호법을 준수하고 안전을 보장하기 위해 연령과 국가를 요청합니다.`)
};

/**
* | output |
* | --- |
* | "We ask for your age and country to make sure we comply with privacy laws and keep you safe." |
*
* @param {Onboarding_Profile_Privacynotice1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_profile_privacynotice1 = /** @type {((inputs?: Onboarding_Profile_Privacynotice1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Profile_Privacynotice1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_profile_privacynotice1(inputs)
	if (locale === "es") return es_onboarding_profile_privacynotice1(inputs)
	if (locale === "de") return de_onboarding_profile_privacynotice1(inputs)
	if (locale === "ar") return ar_onboarding_profile_privacynotice1(inputs)
	if (locale === "fr") return fr_onboarding_profile_privacynotice1(inputs)
	return ko_onboarding_profile_privacynotice1(inputs)
});
export { onboarding_profile_privacynotice1 as "onboarding.profile.privacyNotice" }