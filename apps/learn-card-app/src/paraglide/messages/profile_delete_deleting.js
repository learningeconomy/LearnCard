/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Delete_DeletingInputs */

const en_profile_delete_deleting = /** @type {(inputs: Profile_Delete_DeletingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Deleting Account...`)
};

const es_profile_delete_deleting = /** @type {(inputs: Profile_Delete_DeletingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Eliminando cuenta...`)
};

const de_profile_delete_deleting = /** @type {(inputs: Profile_Delete_DeletingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Konto wird gelöscht...`)
};

const ar_profile_delete_deleting = /** @type {(inputs: Profile_Delete_DeletingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ حذف الحساب...`)
};

const fr_profile_delete_deleting = /** @type {(inputs: Profile_Delete_DeletingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Suppression du compte...`)
};

const ko_profile_delete_deleting = /** @type {(inputs: Profile_Delete_DeletingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`계정 삭제 중...`)
};

/**
* | output |
* | --- |
* | "Deleting Account..." |
*
* @param {Profile_Delete_DeletingInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const profile_delete_deleting = /** @type {((inputs?: Profile_Delete_DeletingInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Delete_DeletingInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_delete_deleting(inputs)
	if (locale === "es") return es_profile_delete_deleting(inputs)
	if (locale === "de") return de_profile_delete_deleting(inputs)
	if (locale === "ar") return ar_profile_delete_deleting(inputs)
	if (locale === "fr") return fr_profile_delete_deleting(inputs)
	return ko_profile_delete_deleting(inputs)
});
export { profile_delete_deleting as "profile.delete.deleting" }