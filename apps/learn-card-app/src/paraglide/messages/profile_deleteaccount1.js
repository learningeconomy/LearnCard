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

const fr_profile_deleteaccount1 = /** @type {(inputs: Profile_Deleteaccount1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Supprimer le compte`)
};

const ar_profile_deleteaccount1 = /** @type {(inputs: Profile_Deleteaccount1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حذف الحساب`)
};

/**
* | output |
* | --- |
* | "Delete Account" |
*
* @param {Profile_Deleteaccount1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const profile_deleteaccount1 = /** @type {((inputs?: Profile_Deleteaccount1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Deleteaccount1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_deleteaccount1(inputs)
	if (locale === "es") return es_profile_deleteaccount1(inputs)
	if (locale === "fr") return fr_profile_deleteaccount1(inputs)
	return ar_profile_deleteaccount1(inputs)
});
export { profile_deleteaccount1 as "profile.deleteAccount" }