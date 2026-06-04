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

const de_onboarding_country_title = /** @type {(inputs: Onboarding_Country_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Land auswählen`)
};

const ar_onboarding_country_title = /** @type {(inputs: Onboarding_Country_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختيار البلد`)
};

const fr_onboarding_country_title = /** @type {(inputs: Onboarding_Country_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionner le pays`)
};

const ko_onboarding_country_title = /** @type {(inputs: Onboarding_Country_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`국가 선택`)
};

/**
* | output |
* | --- |
* | "Select Country" |
*
* @param {Onboarding_Country_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const onboarding_country_title = /** @type {((inputs?: Onboarding_Country_TitleInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Country_TitleInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_country_title(inputs)
	if (locale === "es") return es_onboarding_country_title(inputs)
	if (locale === "de") return de_onboarding_country_title(inputs)
	if (locale === "ar") return ar_onboarding_country_title(inputs)
	if (locale === "fr") return fr_onboarding_country_title(inputs)
	return ko_onboarding_country_title(inputs)
});
export { onboarding_country_title as "onboarding.country.title" }