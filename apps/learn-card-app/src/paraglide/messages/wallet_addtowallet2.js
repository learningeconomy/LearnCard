/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_Addtowallet2Inputs */

const en_wallet_addtowallet2 = /** @type {(inputs: Wallet_Addtowallet2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add to Wallet`)
};

const es_wallet_addtowallet2 = /** @type {(inputs: Wallet_Addtowallet2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Agregar a la billetera`)
};

const fr_wallet_addtowallet2 = /** @type {(inputs: Wallet_Addtowallet2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter au portefeuille`)
};

const ar_wallet_addtowallet2 = /** @type {(inputs: Wallet_Addtowallet2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إضافة إلى المحفظة`)
};

/**
* | output |
* | --- |
* | "Add to Wallet" |
*
* @param {Wallet_Addtowallet2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_addtowallet2 = /** @type {((inputs?: Wallet_Addtowallet2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Addtowallet2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_addtowallet2(inputs)
	if (locale === "es") return es_wallet_addtowallet2(inputs)
	if (locale === "fr") return fr_wallet_addtowallet2(inputs)
	return ar_wallet_addtowallet2(inputs)
});
export { wallet_addtowallet2 as "wallet.addToWallet" }