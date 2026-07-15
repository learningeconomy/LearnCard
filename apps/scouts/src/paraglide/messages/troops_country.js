/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_CountryInputs */

const en_troops_country = /** @type {(inputs: Troops_CountryInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Country`)
};

const es_troops_country = /** @type {(inputs: Troops_CountryInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`País`)
};

const fr_troops_country = /** @type {(inputs: Troops_CountryInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pays`)
};

const ar_troops_country = /** @type {(inputs: Troops_CountryInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الدولة`)
};

/**
* | output |
* | --- |
* | "Country" |
*
* @param {Troops_CountryInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_country = /** @type {((inputs?: Troops_CountryInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_CountryInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_country(inputs)
	if (locale === "es") return es_troops_country(inputs)
	if (locale === "fr") return fr_troops_country(inputs)
	return ar_troops_country(inputs)
});
export { troops_country as "troops.country" }