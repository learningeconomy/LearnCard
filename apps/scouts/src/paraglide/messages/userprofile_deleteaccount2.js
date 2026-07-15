/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Userprofile_Deleteaccount2Inputs */

const en_userprofile_deleteaccount2 = /** @type {(inputs: Userprofile_Deleteaccount2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Delete Account`)
};

const es_userprofile_deleteaccount2 = /** @type {(inputs: Userprofile_Deleteaccount2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Eliminar Cuenta`)
};

const fr_userprofile_deleteaccount2 = /** @type {(inputs: Userprofile_Deleteaccount2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Supprimer le compte`)
};

const ar_userprofile_deleteaccount2 = /** @type {(inputs: Userprofile_Deleteaccount2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حذف الحساب`)
};

/**
* | output |
* | --- |
* | "Delete Account" |
*
* @param {Userprofile_Deleteaccount2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const userprofile_deleteaccount2 = /** @type {((inputs?: Userprofile_Deleteaccount2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Userprofile_Deleteaccount2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_userprofile_deleteaccount2(inputs)
	if (locale === "es") return es_userprofile_deleteaccount2(inputs)
	if (locale === "fr") return fr_userprofile_deleteaccount2(inputs)
	return ar_userprofile_deleteaccount2(inputs)
});
export { userprofile_deleteaccount2 as "userProfile.deleteAccount" }