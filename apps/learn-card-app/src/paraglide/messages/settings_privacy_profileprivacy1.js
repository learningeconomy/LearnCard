/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Settings_Privacy_Profileprivacy1Inputs */

const en_settings_privacy_profileprivacy1 = /** @type {(inputs: Settings_Privacy_Profileprivacy1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Profile Privacy`)
};

const es_settings_privacy_profileprivacy1 = /** @type {(inputs: Settings_Privacy_Profileprivacy1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Privacidad del perfil`)
};

const de_settings_privacy_profileprivacy1 = /** @type {(inputs: Settings_Privacy_Profileprivacy1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Profil-Datenschutz`)
};

const ar_settings_privacy_profileprivacy1 = /** @type {(inputs: Settings_Privacy_Profileprivacy1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`خصوصية الملف الشخصي`)
};

const fr_settings_privacy_profileprivacy1 = /** @type {(inputs: Settings_Privacy_Profileprivacy1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Confidentialité du profil`)
};

const ko_settings_privacy_profileprivacy1 = /** @type {(inputs: Settings_Privacy_Profileprivacy1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`프로필 개인정보`)
};

/**
* | output |
* | --- |
* | "Profile Privacy" |
*
* @param {Settings_Privacy_Profileprivacy1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const settings_privacy_profileprivacy1 = /** @type {((inputs?: Settings_Privacy_Profileprivacy1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Settings_Privacy_Profileprivacy1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_settings_privacy_profileprivacy1(inputs)
	if (locale === "es") return es_settings_privacy_profileprivacy1(inputs)
	if (locale === "de") return de_settings_privacy_profileprivacy1(inputs)
	if (locale === "ar") return ar_settings_privacy_profileprivacy1(inputs)
	if (locale === "fr") return fr_settings_privacy_profileprivacy1(inputs)
	return ko_settings_privacy_profileprivacy1(inputs)
});
export { settings_privacy_profileprivacy1 as "settings.privacy.profilePrivacy" }