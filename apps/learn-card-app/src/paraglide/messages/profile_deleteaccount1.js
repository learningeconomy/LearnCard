/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Deleteaccount1Inputs */

const en_profile_deleteaccount1 = /** @type {(inputs: Profile_Deleteaccount1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Delete Account`)
};

const es_profile_deleteaccount1 = /** @type {(inputs: Profile_Deleteaccount1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Eliminar cuenta`)
};

const de_profile_deleteaccount1 = /** @type {(inputs: Profile_Deleteaccount1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Konto löschen`)
};

const ar_profile_deleteaccount1 = /** @type {(inputs: Profile_Deleteaccount1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حذف الحساب`)
};

const fr_profile_deleteaccount1 = /** @type {(inputs: Profile_Deleteaccount1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Supprimer le compte`)
};

const ko_profile_deleteaccount1 = /** @type {(inputs: Profile_Deleteaccount1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`계정 삭제`)
};

/**
* | output |
* | --- |
* | "Delete Account" |
*
* @param {Profile_Deleteaccount1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const profile_deleteaccount1 = /** @type {((inputs?: Profile_Deleteaccount1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Deleteaccount1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_deleteaccount1(inputs)
	if (locale === "es") return es_profile_deleteaccount1(inputs)
	if (locale === "de") return de_profile_deleteaccount1(inputs)
	if (locale === "ar") return ar_profile_deleteaccount1(inputs)
	if (locale === "fr") return fr_profile_deleteaccount1(inputs)
	return ko_profile_deleteaccount1(inputs)
});
export { profile_deleteaccount1 as "profile.deleteAccount" }