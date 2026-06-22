/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Country_TitleInputs */

const en_onboarding_country_title = /** @type {(inputs: Onboarding_Country_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select Country`)
};

const es_onboarding_country_title = /** @type {(inputs: Onboarding_Country_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Seleccionar país`)
};

const fr_onboarding_country_title = /** @type {(inputs: Onboarding_Country_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionner le pays`)
};

const ar_onboarding_country_title = /** @type {(inputs: Onboarding_Country_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختيار البلد`)
};

/**
* | output |
* | --- |
* | "Select Country" |
*
* @param {Onboarding_Country_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_country_title = /** @type {((inputs?: Onboarding_Country_TitleInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Country_TitleInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_country_title(inputs)
	if (locale === "es") return es_onboarding_country_title(inputs)
	if (locale === "fr") return fr_onboarding_country_title(inputs)
	return ar_onboarding_country_title(inputs)
});
export { onboarding_country_title as "onboarding.country.title" }