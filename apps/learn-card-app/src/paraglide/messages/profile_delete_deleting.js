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

const fr_profile_delete_deleting = /** @type {(inputs: Profile_Delete_DeletingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Suppression du compte...`)
};

const ar_profile_delete_deleting = /** @type {(inputs: Profile_Delete_DeletingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ حذف الحساب...`)
};

/**
* | output |
* | --- |
* | "Deleting Account..." |
*
* @param {Profile_Delete_DeletingInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const profile_delete_deleting = /** @type {((inputs?: Profile_Delete_DeletingInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Delete_DeletingInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_delete_deleting(inputs)
	if (locale === "es") return es_profile_delete_deleting(inputs)
	if (locale === "fr") return fr_profile_delete_deleting(inputs)
	return ar_profile_delete_deleting(inputs)
});
export { profile_delete_deleting as "profile.delete.deleting" }