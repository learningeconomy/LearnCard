/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_Categories_PortfolioInputs */

const en_wallet_categories_portfolio = /** @type {(inputs: Wallet_Categories_PortfolioInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Portfolio`)
};

const es_wallet_categories_portfolio = /** @type {(inputs: Wallet_Categories_PortfolioInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Portafolio`)
};

const fr_wallet_categories_portfolio = /** @type {(inputs: Wallet_Categories_PortfolioInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Portfolio`)
};

const ar_wallet_categories_portfolio = /** @type {(inputs: Wallet_Categories_PortfolioInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المحفظة`)
};

/**
* | output |
* | --- |
* | "Portfolio" |
*
* @param {Wallet_Categories_PortfolioInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_categories_portfolio = /** @type {((inputs?: Wallet_Categories_PortfolioInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Categories_PortfolioInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_categories_portfolio(inputs)
	if (locale === "es") return es_wallet_categories_portfolio(inputs)
	if (locale === "fr") return fr_wallet_categories_portfolio(inputs)
	return ar_wallet_categories_portfolio(inputs)
});
export { wallet_categories_portfolio as "wallet.categories.portfolio" }