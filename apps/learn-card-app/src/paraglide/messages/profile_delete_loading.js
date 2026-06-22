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

const fr_profile_delete_loading = /** @type {(inputs: Profile_Delete_LoadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Chargement...`)
};

const ar_profile_delete_loading = /** @type {(inputs: Profile_Delete_LoadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحميل...`)
};

/**
* | output |
* | --- |
* | "Loading..." |
*
* @param {Profile_Delete_LoadingInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const profile_delete_loading = /** @type {((inputs?: Profile_Delete_LoadingInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Delete_LoadingInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_delete_loading(inputs)
	if (locale === "es") return es_profile_delete_loading(inputs)
	if (locale === "fr") return fr_profile_delete_loading(inputs)
	return ar_profile_delete_loading(inputs)
});
export { profile_delete_loading as "profile.delete.loading" }