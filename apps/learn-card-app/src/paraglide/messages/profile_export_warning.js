/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Export_WarningInputs */

const en_profile_export_warning = /** @type {(inputs: Profile_Export_WarningInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Warning!`)
};

const es_profile_export_warning = /** @type {(inputs: Profile_Export_WarningInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Advertencia!`)
};

const de_profile_export_warning = /** @type {(inputs: Profile_Export_WarningInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Warnung!`)
};

const ar_profile_export_warning = /** @type {(inputs: Profile_Export_WarningInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحذير!`)
};

const fr_profile_export_warning = /** @type {(inputs: Profile_Export_WarningInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Avertissement!`)
};

const ko_profile_export_warning = /** @type {(inputs: Profile_Export_WarningInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`경고!`)
};

/**
* | output |
* | --- |
* | "Warning!" |
*
* @param {Profile_Export_WarningInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const profile_export_warning = /** @type {((inputs?: Profile_Export_WarningInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Export_WarningInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_export_warning(inputs)
	if (locale === "es") return es_profile_export_warning(inputs)
	if (locale === "de") return de_profile_export_warning(inputs)
	if (locale === "ar") return ar_profile_export_warning(inputs)
	if (locale === "fr") return fr_profile_export_warning(inputs)
	return ko_profile_export_warning(inputs)
});
export { profile_export_warning as "profile.export.warning" }