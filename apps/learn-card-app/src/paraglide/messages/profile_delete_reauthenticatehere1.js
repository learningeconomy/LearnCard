/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Delete_Reauthenticatehere1Inputs */

const en_profile_delete_reauthenticatehere1 = /** @type {(inputs: Profile_Delete_Reauthenticatehere1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Reauthenticate here`)
};

const es_profile_delete_reauthenticatehere1 = /** @type {(inputs: Profile_Delete_Reauthenticatehere1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Volver a autenticarse aquí`)
};

const de_profile_delete_reauthenticatehere1 = /** @type {(inputs: Profile_Delete_Reauthenticatehere1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Hier erneut authentifizieren`)
};

const ar_profile_delete_reauthenticatehere1 = /** @type {(inputs: Profile_Delete_Reauthenticatehere1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إعادة المصادقة هنا`)
};

const fr_profile_delete_reauthenticatehere1 = /** @type {(inputs: Profile_Delete_Reauthenticatehere1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Réauthentifiez-vous ici`)
};

const ko_profile_delete_reauthenticatehere1 = /** @type {(inputs: Profile_Delete_Reauthenticatehere1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`여기서 재인증하세요`)
};

/**
* | output |
* | --- |
* | "Reauthenticate here" |
*
* @param {Profile_Delete_Reauthenticatehere1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const profile_delete_reauthenticatehere1 = /** @type {((inputs?: Profile_Delete_Reauthenticatehere1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Delete_Reauthenticatehere1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_delete_reauthenticatehere1(inputs)
	if (locale === "es") return es_profile_delete_reauthenticatehere1(inputs)
	if (locale === "de") return de_profile_delete_reauthenticatehere1(inputs)
	if (locale === "ar") return ar_profile_delete_reauthenticatehere1(inputs)
	if (locale === "fr") return fr_profile_delete_reauthenticatehere1(inputs)
	return ko_profile_delete_reauthenticatehere1(inputs)
});
export { profile_delete_reauthenticatehere1 as "profile.delete.reauthenticateHere" }