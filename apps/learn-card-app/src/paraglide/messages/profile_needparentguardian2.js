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

const fr_profile_needparentguardian2 = /** @type {(inputs: Profile_Needparentguardian2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous aurez besoin d'un parent ou d'un tuteur pour créer un compte familial avant de pouvoir vous inscrire.`)
};

const ar_profile_needparentguardian2 = /** @type {(inputs: Profile_Needparentguardian2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ستحتاج إلى أحد الوالدين أو الوصي لإعداد حساب العائلة قبل أن تتمكن من الانضمام.`)
};

/**
* | output |
* | --- |
* | "You'll need a parent or guardian to set up a Family Account before you can join." |
*
* @param {Profile_Needparentguardian2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const profile_needparentguardian2 = /** @type {((inputs?: Profile_Needparentguardian2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Needparentguardian2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_needparentguardian2(inputs)
	if (locale === "es") return es_profile_needparentguardian2(inputs)
	if (locale === "fr") return fr_profile_needparentguardian2(inputs)
	return ar_profile_needparentguardian2(inputs)
});
export { profile_needparentguardian2 as "profile.needParentGuardian" }