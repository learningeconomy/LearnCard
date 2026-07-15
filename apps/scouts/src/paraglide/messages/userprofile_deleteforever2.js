/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Userprofile_Deleteforever2Inputs */

const en_userprofile_deleteforever2 = /** @type {(inputs: Userprofile_Deleteforever2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Delete Forever`)
};

const es_userprofile_deleteforever2 = /** @type {(inputs: Userprofile_Deleteforever2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Eliminar Permanentemente`)
};

const fr_userprofile_deleteforever2 = /** @type {(inputs: Userprofile_Deleteforever2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Supprimer définitivement`)
};

const ar_userprofile_deleteforever2 = /** @type {(inputs: Userprofile_Deleteforever2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حذف نهائي`)
};

/**
* | output |
* | --- |
* | "Delete Forever" |
*
* @param {Userprofile_Deleteforever2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const userprofile_deleteforever2 = /** @type {((inputs?: Userprofile_Deleteforever2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Userprofile_Deleteforever2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_userprofile_deleteforever2(inputs)
	if (locale === "es") return es_userprofile_deleteforever2(inputs)
	if (locale === "fr") return fr_userprofile_deleteforever2(inputs)
	return ar_userprofile_deleteforever2(inputs)
});
export { userprofile_deleteforever2 as "userProfile.deleteForever" }