/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_Categoriessingular_Portfolio1Inputs */

const en_wallet_categoriessingular_portfolio1 = /** @type {(inputs: Wallet_Categoriessingular_Portfolio1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Portfolio`)
};

const es_wallet_categoriessingular_portfolio1 = /** @type {(inputs: Wallet_Categoriessingular_Portfolio1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Portafolio`)
};

const fr_wallet_categoriessingular_portfolio1 = /** @type {(inputs: Wallet_Categoriessingular_Portfolio1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Portfolio`)
};

const ar_wallet_categoriessingular_portfolio1 = /** @type {(inputs: Wallet_Categoriessingular_Portfolio1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`محفظة`)
};

/**
* | output |
* | --- |
* | "Portfolio" |
*
* @param {Wallet_Categoriessingular_Portfolio1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_categoriessingular_portfolio1 = /** @type {((inputs?: Wallet_Categoriessingular_Portfolio1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Categoriessingular_Portfolio1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_categoriessingular_portfolio1(inputs)
	if (locale === "es") return es_wallet_categoriessingular_portfolio1(inputs)
	if (locale === "fr") return fr_wallet_categoriessingular_portfolio1(inputs)
	return ar_wallet_categoriessingular_portfolio1(inputs)
});
export { wallet_categoriessingular_portfolio1 as "wallet.categoriesSingular.portfolio" }