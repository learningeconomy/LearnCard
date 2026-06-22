/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_ManagedInputs */

const en_wallet_managed = /** @type {(inputs: Wallet_ManagedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Managed`)
};

const es_wallet_managed = /** @type {(inputs: Wallet_ManagedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gestionadas`)
};

const fr_wallet_managed = /** @type {(inputs: Wallet_ManagedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gérés`)
};

const ar_wallet_managed = /** @type {(inputs: Wallet_ManagedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المُدارة`)
};

/**
* | output |
* | --- |
* | "Managed" |
*
* @param {Wallet_ManagedInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_managed = /** @type {((inputs?: Wallet_ManagedInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_ManagedInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_managed(inputs)
	if (locale === "es") return es_wallet_managed(inputs)
	if (locale === "fr") return fr_wallet_managed(inputs)
	return ar_wallet_managed(inputs)
});
export { wallet_managed as "wallet.managed" }