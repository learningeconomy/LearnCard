/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Delete_Deleteforever1Inputs */

const en_profile_delete_deleteforever1 = /** @type {(inputs: Profile_Delete_Deleteforever1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Delete Forever`)
};

const es_profile_delete_deleteforever1 = /** @type {(inputs: Profile_Delete_Deleteforever1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Eliminar para siempre`)
};

const de_profile_delete_deleteforever1 = /** @type {(inputs: Profile_Delete_Deleteforever1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Für immer löschen`)
};

const ar_profile_delete_deleteforever1 = /** @type {(inputs: Profile_Delete_Deleteforever1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حذف إلى الأبد`)
};

const fr_profile_delete_deleteforever1 = /** @type {(inputs: Profile_Delete_Deleteforever1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Supprimer pour toujours`)
};

const ko_profile_delete_deleteforever1 = /** @type {(inputs: Profile_Delete_Deleteforever1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`영원히 삭제`)
};

/**
* | output |
* | --- |
* | "Delete Forever" |
*
* @param {Profile_Delete_Deleteforever1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const profile_delete_deleteforever1 = /** @type {((inputs?: Profile_Delete_Deleteforever1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Delete_Deleteforever1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_delete_deleteforever1(inputs)
	if (locale === "es") return es_profile_delete_deleteforever1(inputs)
	if (locale === "de") return de_profile_delete_deleteforever1(inputs)
	if (locale === "ar") return ar_profile_delete_deleteforever1(inputs)
	if (locale === "fr") return fr_profile_delete_deleteforever1(inputs)
	return ko_profile_delete_deleteforever1(inputs)
});
export { profile_delete_deleteforever1 as "profile.delete.deleteForever" }