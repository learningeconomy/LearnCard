/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Editprofile1Inputs */

const en_profile_editprofile1 = /** @type {(inputs: Profile_Editprofile1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Edit Profile`)
};

const es_profile_editprofile1 = /** @type {(inputs: Profile_Editprofile1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Editar perfil`)
};

const de_profile_editprofile1 = /** @type {(inputs: Profile_Editprofile1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Profil bearbeiten`)
};

const ar_profile_editprofile1 = /** @type {(inputs: Profile_Editprofile1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحرير الملف الشخصي`)
};

const fr_profile_editprofile1 = /** @type {(inputs: Profile_Editprofile1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modifier le profil`)
};

const ko_profile_editprofile1 = /** @type {(inputs: Profile_Editprofile1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`프로필 편집`)
};

/**
* | output |
* | --- |
* | "Edit Profile" |
*
* @param {Profile_Editprofile1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const profile_editprofile1 = /** @type {((inputs?: Profile_Editprofile1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Editprofile1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_editprofile1(inputs)
	if (locale === "es") return es_profile_editprofile1(inputs)
	if (locale === "de") return de_profile_editprofile1(inputs)
	if (locale === "ar") return ar_profile_editprofile1(inputs)
	if (locale === "fr") return fr_profile_editprofile1(inputs)
	return ko_profile_editprofile1(inputs)
});
export { profile_editprofile1 as "profile.editProfile" }