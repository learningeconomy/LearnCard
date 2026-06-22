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

const fr_profile_export_warning = /** @type {(inputs: Profile_Export_WarningInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Avertissement!`)
};

const ar_profile_export_warning = /** @type {(inputs: Profile_Export_WarningInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحذير!`)
};

/**
* | output |
* | --- |
* | "Warning!" |
*
* @param {Profile_Export_WarningInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const profile_export_warning = /** @type {((inputs?: Profile_Export_WarningInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Export_WarningInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_export_warning(inputs)
	if (locale === "es") return es_profile_export_warning(inputs)
	if (locale === "fr") return fr_profile_export_warning(inputs)
	return ar_profile_export_warning(inputs)
});
export { profile_export_warning as "profile.export.warning" }