/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Country_SearchInputs */

const en_onboarding_country_search = /** @type {(inputs: Onboarding_Country_SearchInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Search countries`)
};

const es_onboarding_country_search = /** @type {(inputs: Onboarding_Country_SearchInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Buscar países`)
};

const de_onboarding_country_search = /** @type {(inputs: Onboarding_Country_SearchInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Länder suchen`)
};

const ar_onboarding_country_search = /** @type {(inputs: Onboarding_Country_SearchInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`البحث عن البلدان`)
};

const fr_onboarding_country_search = /** @type {(inputs: Onboarding_Country_SearchInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rechercher des pays`)
};

const ko_onboarding_country_search = /** @type {(inputs: Onboarding_Country_SearchInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`국가 검색`)
};

/**
* | output |
* | --- |
* | "Search countries" |
*
* @param {Onboarding_Country_SearchInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_country_search = /** @type {((inputs?: Onboarding_Country_SearchInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Country_SearchInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_country_search(inputs)
	if (locale === "es") return es_onboarding_country_search(inputs)
	if (locale === "de") return de_onboarding_country_search(inputs)
	if (locale === "ar") return ar_onboarding_country_search(inputs)
	if (locale === "fr") return fr_onboarding_country_search(inputs)
	return ko_onboarding_country_search(inputs)
});
export { onboarding_country_search as "onboarding.country.search" }