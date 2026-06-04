/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Profile_CountryInputs */

const en_profile_country = /** @type {(inputs: Profile_CountryInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Country`)
};

const es_profile_country = /** @type {(inputs: Profile_CountryInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`País`)
};

const de_profile_country = /** @type {(inputs: Profile_CountryInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Land`)
};

const ar_profile_country = /** @type {(inputs: Profile_CountryInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`دولة`)
};

const fr_profile_country = /** @type {(inputs: Profile_CountryInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pays`)
};

const ko_profile_country = /** @type {(inputs: Profile_CountryInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`국가`)
};

/**
* | output |
* | --- |
* | "Country" |
*
* @param {Profile_CountryInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const profile_country = /** @type {((inputs?: Profile_CountryInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_CountryInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_country(inputs)
	if (locale === "es") return es_profile_country(inputs)
	if (locale === "de") return de_profile_country(inputs)
	if (locale === "ar") return ar_profile_country(inputs)
	if (locale === "fr") return fr_profile_country(inputs)
	return ko_profile_country(inputs)
});
export { profile_country as "profile.country" }