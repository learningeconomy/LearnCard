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

const fr_profile_export_cancel = /** @type {(inputs: Profile_Export_CancelInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Annuler`)
};

const ar_profile_export_cancel = /** @type {(inputs: Profile_Export_CancelInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يلغي`)
};

/**
* | output |
* | --- |
* | "Cancel" |
*
* @param {Profile_Export_CancelInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const profile_export_cancel = /** @type {((inputs?: Profile_Export_CancelInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Export_CancelInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_export_cancel(inputs)
	if (locale === "es") return es_profile_export_cancel(inputs)
	if (locale === "fr") return fr_profile_export_cancel(inputs)
	return ar_profile_export_cancel(inputs)
});
export { profile_export_cancel as "profile.export.cancel" }