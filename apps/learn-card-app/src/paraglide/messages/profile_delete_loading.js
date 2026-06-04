/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Delete_LoadingInputs */

const en_profile_delete_loading = /** @type {(inputs: Profile_Delete_LoadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Loading...`)
};

const es_profile_delete_loading = /** @type {(inputs: Profile_Delete_LoadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cargando...`)
};

const de_profile_delete_loading = /** @type {(inputs: Profile_Delete_LoadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Laden...`)
};

const ar_profile_delete_loading = /** @type {(inputs: Profile_Delete_LoadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحميل...`)
};

const fr_profile_delete_loading = /** @type {(inputs: Profile_Delete_LoadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Chargement...`)
};

const ko_profile_delete_loading = /** @type {(inputs: Profile_Delete_LoadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`로드 중...`)
};

/**
* | output |
* | --- |
* | "Loading..." |
*
* @param {Profile_Delete_LoadingInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const profile_delete_loading = /** @type {((inputs?: Profile_Delete_LoadingInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Delete_LoadingInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_delete_loading(inputs)
	if (locale === "es") return es_profile_delete_loading(inputs)
	if (locale === "de") return de_profile_delete_loading(inputs)
	if (locale === "ar") return ar_profile_delete_loading(inputs)
	if (locale === "fr") return fr_profile_delete_loading(inputs)
	return ko_profile_delete_loading(inputs)
});
export { profile_delete_loading as "profile.delete.loading" }