/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidemenu_Links_WalletInputs */

const en_sidemenu_links_wallet = /** @type {(inputs: Sidemenu_Links_WalletInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Wallet`)
};

const es_sidemenu_links_wallet = /** @type {(inputs: Sidemenu_Links_WalletInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cartera`)
};

const de_sidemenu_links_wallet = /** @type {(inputs: Sidemenu_Links_WalletInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Wallet`)
};

const ar_sidemenu_links_wallet = /** @type {(inputs: Sidemenu_Links_WalletInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المحفظة`)
};

/**
* | output |
* | --- |
* | "Wallet" |
*
* @param {Sidemenu_Links_WalletInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" }} options
* @returns {LocalizedString}
*/
const sidemenu_links_wallet = /** @type {((inputs?: Sidemenu_Links_WalletInputs, options?: { locale?: "en" | "es" | "de" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidemenu_Links_WalletInputs, { locale?: "en" | "es" | "de" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidemenu_links_wallet(inputs)
	if (locale === "es") return es_sidemenu_links_wallet(inputs)
	if (locale === "de") return de_sidemenu_links_wallet(inputs)
	return ar_sidemenu_links_wallet(inputs)
});
export { sidemenu_links_wallet as "sidemenu.links.wallet" }