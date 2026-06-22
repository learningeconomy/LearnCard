/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_Export_Revealprompt1Inputs */

const en_profile_export_revealprompt1 = /** @type {(inputs: Profile_Export_Revealprompt1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`I understand - Reveal My Seed`)
};

const es_profile_export_revealprompt1 = /** @type {(inputs: Profile_Export_Revealprompt1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Entiendo - Revela Mi Semilla`)
};

const fr_profile_export_revealprompt1 = /** @type {(inputs: Profile_Export_Revealprompt1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Je comprends - Révéler ma graine`)
};

const ar_profile_export_revealprompt1 = /** @type {(inputs: Profile_Export_Revealprompt1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أنا أفهم – اكشف عن بذرتي`)
};

/**
* | output |
* | --- |
* | "I understand - Reveal My Seed" |
*
* @param {Profile_Export_Revealprompt1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const profile_export_revealprompt1 = /** @type {((inputs?: Profile_Export_Revealprompt1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_Export_Revealprompt1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_export_revealprompt1(inputs)
	if (locale === "es") return es_profile_export_revealprompt1(inputs)
	if (locale === "fr") return fr_profile_export_revealprompt1(inputs)
	return ar_profile_export_revealprompt1(inputs)
});
export { profile_export_revealprompt1 as "profile.export.revealPrompt" }