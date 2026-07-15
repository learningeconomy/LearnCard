/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Connect_Altcurrencies1Inputs */

const en_connect_altcurrencies1 = /** @type {(inputs: Connect_Altcurrencies1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`currencies`)
};

const es_connect_altcurrencies1 = /** @type {(inputs: Connect_Altcurrencies1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`monedas`)
};

const fr_connect_altcurrencies1 = /** @type {(inputs: Connect_Altcurrencies1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`devises`)
};

const ar_connect_altcurrencies1 = /** @type {(inputs: Connect_Altcurrencies1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عملات`)
};

/**
* | output |
* | --- |
* | "currencies" |
*
* @param {Connect_Altcurrencies1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const connect_altcurrencies1 = /** @type {((inputs?: Connect_Altcurrencies1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Connect_Altcurrencies1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_connect_altcurrencies1(inputs)
	if (locale === "es") return es_connect_altcurrencies1(inputs)
	if (locale === "fr") return fr_connect_altcurrencies1(inputs)
	return ar_connect_altcurrencies1(inputs)
});
export { connect_altcurrencies1 as "connect.altCurrencies" }