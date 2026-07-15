/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Currencies_NoneInputs */

const en_currencies_none = /** @type {(inputs: Currencies_NoneInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No currencies yet.`)
};

const es_currencies_none = /** @type {(inputs: Currencies_NoneInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún no hay monedas.`)
};

const fr_currencies_none = /** @type {(inputs: Currencies_NoneInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune devise pour l'instant.`)
};

const ar_currencies_none = /** @type {(inputs: Currencies_NoneInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No currencies yet.`)
};

/**
* | output |
* | --- |
* | "No currencies yet." |
*
* @param {Currencies_NoneInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const currencies_none = /** @type {((inputs?: Currencies_NoneInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Currencies_NoneInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_currencies_none(inputs)
	if (locale === "es") return es_currencies_none(inputs)
	if (locale === "fr") return fr_currencies_none(inputs)
	return ar_currencies_none(inputs)
});
export { currencies_none as "currencies.none" }