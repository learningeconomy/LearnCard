/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidemenu_Links_PortfolioInputs */

const en_sidemenu_links_portfolio = /** @type {(inputs: Sidemenu_Links_PortfolioInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Portfolio`)
};

const es_sidemenu_links_portfolio = /** @type {(inputs: Sidemenu_Links_PortfolioInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Portafolio`)
};

const de_sidemenu_links_portfolio = /** @type {(inputs: Sidemenu_Links_PortfolioInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Portfolio`)
};

const ar_sidemenu_links_portfolio = /** @type {(inputs: Sidemenu_Links_PortfolioInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المحفظة`)
};

const fr_sidemenu_links_portfolio = /** @type {(inputs: Sidemenu_Links_PortfolioInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Portfolio`)
};

const ko_sidemenu_links_portfolio = /** @type {(inputs: Sidemenu_Links_PortfolioInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`포트폴리오`)
};

/**
* | output |
* | --- |
* | "Portfolio" |
*
* @param {Sidemenu_Links_PortfolioInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const sidemenu_links_portfolio = /** @type {((inputs?: Sidemenu_Links_PortfolioInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidemenu_Links_PortfolioInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidemenu_links_portfolio(inputs)
	if (locale === "es") return es_sidemenu_links_portfolio(inputs)
	if (locale === "de") return de_sidemenu_links_portfolio(inputs)
	if (locale === "ar") return ar_sidemenu_links_portfolio(inputs)
	if (locale === "fr") return fr_sidemenu_links_portfolio(inputs)
	return ko_sidemenu_links_portfolio(inputs)
});
export { sidemenu_links_portfolio as "sidemenu.links.portfolio" }