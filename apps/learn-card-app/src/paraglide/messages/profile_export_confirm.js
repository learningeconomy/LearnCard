/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Export_ConfirmInputs */

const en_profile_export_confirm = /** @type {(inputs: Profile_Export_ConfirmInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Confirm`)
};

const es_profile_export_confirm = /** @type {(inputs: Profile_Export_ConfirmInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Confirmar`)
};

const fr_profile_export_confirm = /** @type {(inputs: Profile_Export_ConfirmInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Confirmer`)
};

const ar_profile_export_confirm = /** @type {(inputs: Profile_Export_ConfirmInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يتأكد`)
};

/**
* | output |
* | --- |
* | "Confirm" |
*
* @param {Profile_Export_ConfirmInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const profile_export_confirm = /** @type {((inputs?: Profile_Export_ConfirmInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Export_ConfirmInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_export_confirm(inputs)
	if (locale === "es") return es_profile_export_confirm(inputs)
	if (locale === "fr") return fr_profile_export_confirm(inputs)
	return ar_profile_export_confirm(inputs)
});
export { profile_export_confirm as "profile.export.confirm" }