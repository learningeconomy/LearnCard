/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Currencies_Altimg1Inputs */

const en_currencies_altimg1 = /** @type {(inputs: Currencies_Altimg1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`currencies`)
};

const es_currencies_altimg1 = /** @type {(inputs: Currencies_Altimg1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`monedas`)
};

const fr_currencies_altimg1 = /** @type {(inputs: Currencies_Altimg1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`devises`)
};

const ar_currencies_altimg1 = /** @type {(inputs: Currencies_Altimg1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`currencies`)
};

/**
* | output |
* | --- |
* | "currencies" |
*
* @param {Currencies_Altimg1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const currencies_altimg1 = /** @type {((inputs?: Currencies_Altimg1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Currencies_Altimg1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_currencies_altimg1(inputs)
	if (locale === "es") return es_currencies_altimg1(inputs)
	if (locale === "fr") return fr_currencies_altimg1(inputs)
	return ar_currencies_altimg1(inputs)
});
export { currencies_altimg1 as "currencies.altImg" }