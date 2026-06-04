/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Needparentguardian2Inputs */

const en_profile_needparentguardian2 = /** @type {(inputs: Profile_Needparentguardian2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You'll need a parent or guardian to set up a Family Account before you can join.`)
};

const es_profile_needparentguardian2 = /** @type {(inputs: Profile_Needparentguardian2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Necesitarás que un padre o tutor configure una cuenta familiar antes de poder unirte.`)
};

const de_profile_needparentguardian2 = /** @type {(inputs: Profile_Needparentguardian2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bevor Sie beitreten können, benötigen Sie einen Elternteil oder Erziehungsberechtigten, der ein Familienkonto einrichtet.`)
};

const ar_profile_needparentguardian2 = /** @type {(inputs: Profile_Needparentguardian2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ستحتاج إلى أحد الوالدين أو الوصي لإعداد حساب العائلة قبل أن تتمكن من الانضمام.`)
};

const fr_profile_needparentguardian2 = /** @type {(inputs: Profile_Needparentguardian2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous aurez besoin d'un parent ou d'un tuteur pour créer un compte familial avant de pouvoir vous inscrire.`)
};

const ko_profile_needparentguardian2 = /** @type {(inputs: Profile_Needparentguardian2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`가족 계정에 가입하려면 먼저 부모나 보호자가 있어야 가족 계정을 설정할 수 있습니다.`)
};

/**
* | output |
* | --- |
* | "You'll need a parent or guardian to set up a Family Account before you can join." |
*
* @param {Profile_Needparentguardian2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const profile_needparentguardian2 = /** @type {((inputs?: Profile_Needparentguardian2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Needparentguardian2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_needparentguardian2(inputs)
	if (locale === "es") return es_profile_needparentguardian2(inputs)
	if (locale === "de") return de_profile_needparentguardian2(inputs)
	if (locale === "ar") return ar_profile_needparentguardian2(inputs)
	if (locale === "fr") return fr_profile_needparentguardian2(inputs)
	return ko_profile_needparentguardian2(inputs)
});
export { profile_needparentguardian2 as "profile.needParentGuardian" }