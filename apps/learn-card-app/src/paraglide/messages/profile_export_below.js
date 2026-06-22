/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Export_BelowInputs */

const en_profile_export_below = /** @type {(inputs: Profile_Export_BelowInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`below.`)
};

const es_profile_export_below = /** @type {(inputs: Profile_Export_BelowInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`abajo.`)
};

const fr_profile_export_below = /** @type {(inputs: Profile_Export_BelowInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ci-dessous.`)
};

const ar_profile_export_below = /** @type {(inputs: Profile_Export_BelowInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أقل.`)
};

/**
* | output |
* | --- |
* | "below." |
*
* @param {Profile_Export_BelowInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const profile_export_below = /** @type {((inputs?: Profile_Export_BelowInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Export_BelowInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_export_below(inputs)
	if (locale === "es") return es_profile_export_below(inputs)
	if (locale === "fr") return fr_profile_export_below(inputs)
	return ar_profile_export_below(inputs)
});
export { profile_export_below as "profile.export.below" }