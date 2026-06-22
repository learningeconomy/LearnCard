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

const fr_profile_delete_reauthenticatehere1 = /** @type {(inputs: Profile_Delete_Reauthenticatehere1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Réauthentifiez-vous ici`)
};

const ar_profile_delete_reauthenticatehere1 = /** @type {(inputs: Profile_Delete_Reauthenticatehere1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إعادة المصادقة هنا`)
};

/**
* | output |
* | --- |
* | "Reauthenticate here" |
*
* @param {Profile_Delete_Reauthenticatehere1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const profile_delete_reauthenticatehere1 = /** @type {((inputs?: Profile_Delete_Reauthenticatehere1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Delete_Reauthenticatehere1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_delete_reauthenticatehere1(inputs)
	if (locale === "es") return es_profile_delete_reauthenticatehere1(inputs)
	if (locale === "fr") return fr_profile_delete_reauthenticatehere1(inputs)
	return ar_profile_delete_reauthenticatehere1(inputs)
});
export { profile_delete_reauthenticatehere1 as "profile.delete.reauthenticateHere" }