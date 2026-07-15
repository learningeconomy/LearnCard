/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Userprofile_Reauthenticatehere2Inputs */

const en_userprofile_reauthenticatehere2 = /** @type {(inputs: Userprofile_Reauthenticatehere2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Reauthenticate here`)
};

const es_userprofile_reauthenticatehere2 = /** @type {(inputs: Userprofile_Reauthenticatehere2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Reautentícate aquí`)
};

const fr_userprofile_reauthenticatehere2 = /** @type {(inputs: Userprofile_Reauthenticatehere2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Réauthentifiez-vous ici`)
};

const ar_userprofile_reauthenticatehere2 = /** @type {(inputs: Userprofile_Reauthenticatehere2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Reauthenticate here`)
};

/**
* | output |
* | --- |
* | "Reauthenticate here" |
*
* @param {Userprofile_Reauthenticatehere2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const userprofile_reauthenticatehere2 = /** @type {((inputs?: Userprofile_Reauthenticatehere2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Userprofile_Reauthenticatehere2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_userprofile_reauthenticatehere2(inputs)
	if (locale === "es") return es_userprofile_reauthenticatehere2(inputs)
	if (locale === "fr") return fr_userprofile_reauthenticatehere2(inputs)
	return ar_userprofile_reauthenticatehere2(inputs)
});
export { userprofile_reauthenticatehere2 as "userProfile.reauthenticateHere" }