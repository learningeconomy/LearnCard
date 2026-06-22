/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Delete_TitleInputs */

const en_profile_delete_title = /** @type {(inputs: Profile_Delete_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Delete Account?`)
};

const es_profile_delete_title = /** @type {(inputs: Profile_Delete_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Eliminar cuenta?`)
};

const fr_profile_delete_title = /** @type {(inputs: Profile_Delete_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Supprimer le compte ?`)
};

const ar_profile_delete_title = /** @type {(inputs: Profile_Delete_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هل تريد حذف الحساب؟`)
};

/**
* | output |
* | --- |
* | "Delete Account?" |
*
* @param {Profile_Delete_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const profile_delete_title = /** @type {((inputs?: Profile_Delete_TitleInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Delete_TitleInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_delete_title(inputs)
	if (locale === "es") return es_profile_delete_title(inputs)
	if (locale === "fr") return fr_profile_delete_title(inputs)
	return ar_profile_delete_title(inputs)
});
export { profile_delete_title as "profile.delete.title" }