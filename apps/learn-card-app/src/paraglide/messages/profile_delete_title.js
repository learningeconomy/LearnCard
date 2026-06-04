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

const de_profile_delete_title = /** @type {(inputs: Profile_Delete_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Konto löschen?`)
};

const ar_profile_delete_title = /** @type {(inputs: Profile_Delete_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هل تريد حذف الحساب؟`)
};

const fr_profile_delete_title = /** @type {(inputs: Profile_Delete_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Supprimer le compte ?`)
};

const ko_profile_delete_title = /** @type {(inputs: Profile_Delete_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`계정을 삭제하시겠습니까?`)
};

/**
* | output |
* | --- |
* | "Delete Account?" |
*
* @param {Profile_Delete_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const profile_delete_title = /** @type {((inputs?: Profile_Delete_TitleInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Delete_TitleInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_delete_title(inputs)
	if (locale === "es") return es_profile_delete_title(inputs)
	if (locale === "de") return de_profile_delete_title(inputs)
	if (locale === "ar") return ar_profile_delete_title(inputs)
	if (locale === "fr") return fr_profile_delete_title(inputs)
	return ko_profile_delete_title(inputs)
});
export { profile_delete_title as "profile.delete.title" }