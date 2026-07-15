/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Userprofile_Deleteaccounttitle3Inputs */

const en_userprofile_deleteaccounttitle3 = /** @type {(inputs: Userprofile_Deleteaccounttitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Delete Account?`)
};

const es_userprofile_deleteaccounttitle3 = /** @type {(inputs: Userprofile_Deleteaccounttitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Eliminar Cuenta?`)
};

const fr_userprofile_deleteaccounttitle3 = /** @type {(inputs: Userprofile_Deleteaccounttitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Supprimer le compte ?`)
};

const ar_userprofile_deleteaccounttitle3 = /** @type {(inputs: Userprofile_Deleteaccounttitle3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Delete Account?`)
};

/**
* | output |
* | --- |
* | "Delete Account?" |
*
* @param {Userprofile_Deleteaccounttitle3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const userprofile_deleteaccounttitle3 = /** @type {((inputs?: Userprofile_Deleteaccounttitle3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Userprofile_Deleteaccounttitle3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_userprofile_deleteaccounttitle3(inputs)
	if (locale === "es") return es_userprofile_deleteaccounttitle3(inputs)
	if (locale === "fr") return fr_userprofile_deleteaccounttitle3(inputs)
	return ar_userprofile_deleteaccounttitle3(inputs)
});
export { userprofile_deleteaccounttitle3 as "userProfile.deleteAccountTitle" }