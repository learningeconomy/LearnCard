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

const fr_sidemenu_links_portfolio = /** @type {(inputs: Sidemenu_Links_PortfolioInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Portfolio`)
};

const ar_sidemenu_links_portfolio = /** @type {(inputs: Sidemenu_Links_PortfolioInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المحفظة`)
};

/**
* | output |
* | --- |
* | "Portfolio" |
*
* @param {Sidemenu_Links_PortfolioInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const sidemenu_links_portfolio = /** @type {((inputs?: Sidemenu_Links_PortfolioInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidemenu_Links_PortfolioInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidemenu_links_portfolio(inputs)
	if (locale === "es") return es_sidemenu_links_portfolio(inputs)
	if (locale === "fr") return fr_sidemenu_links_portfolio(inputs)
	return ar_sidemenu_links_portfolio(inputs)
});
export { sidemenu_links_portfolio as "sidemenu.links.portfolio" }