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

const fr_profile_country = /** @type {(inputs: Profile_CountryInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pays`)
};

const ar_profile_country = /** @type {(inputs: Profile_CountryInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`دولة`)
};

/**
* | output |
* | --- |
* | "Country" |
*
* @param {Profile_CountryInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const profile_country = /** @type {((inputs?: Profile_CountryInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Profile_CountryInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_profile_country(inputs)
	if (locale === "es") return es_profile_country(inputs)
	if (locale === "fr") return fr_profile_country(inputs)
	return ar_profile_country(inputs)
});
export { profile_country as "profile.country" }