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

const fr_onboarding_country_search = /** @type {(inputs: Onboarding_Country_SearchInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rechercher des pays`)
};

const ar_onboarding_country_search = /** @type {(inputs: Onboarding_Country_SearchInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`البحث عن البلدان`)
};

/**
* | output |
* | --- |
* | "Search countries" |
*
* @param {Onboarding_Country_SearchInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_country_search = /** @type {((inputs?: Onboarding_Country_SearchInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Country_SearchInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_country_search(inputs)
	if (locale === "es") return es_onboarding_country_search(inputs)
	if (locale === "fr") return fr_onboarding_country_search(inputs)
	return ar_onboarding_country_search(inputs)
});
export { onboarding_country_search as "onboarding.country.search" }