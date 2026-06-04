/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Export_CancelInputs */

const en_profile_export_cancel = /** @type {(inputs: Profile_Export_CancelInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cancel`)
};

const es_profile_export_cancel = /** @type {(inputs: Profile_Export_CancelInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cancelar`)
};

const de_profile_export_cancel = /** @type {(inputs: Profile_Export_CancelInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Stornieren`)
};

const ar_profile_export_cancel = /** @type {(inputs: Profile_Export_CancelInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يلغي`)
};

const fr_profile_export_cancel = /** @type {(inputs: Profile_Export_CancelInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Annuler`)
};

const ko_profile_export_cancel = /** @type {(inputs: Profile_Export_CancelInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`취소`)
};

/**
* | output |
* | --- |
* | "Cancel" |
*
* @param {Profile_Export_CancelInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const profile_export_cancel = /** @type {((inputs?: Profile_Export_CancelInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Export_CancelInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_export_cancel(inputs)
	if (locale === "es") return es_profile_export_cancel(inputs)
	if (locale === "de") return de_profile_export_cancel(inputs)
	if (locale === "ar") return ar_profile_export_cancel(inputs)
	if (locale === "fr") return fr_profile_export_cancel(inputs)
	return ko_profile_export_cancel(inputs)
});
export { profile_export_cancel as "profile.export.cancel" }