/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_Categorydescriptor_Gotit2Inputs */

const en_wallet_categorydescriptor_gotit2 = /** @type {(inputs: Wallet_Categorydescriptor_Gotit2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Got it`)
};

const es_wallet_categorydescriptor_gotit2 = /** @type {(inputs: Wallet_Categorydescriptor_Gotit2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Entendido`)
};

const fr_wallet_categorydescriptor_gotit2 = /** @type {(inputs: Wallet_Categorydescriptor_Gotit2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compris`)
};

const ar_wallet_categorydescriptor_gotit2 = /** @type {(inputs: Wallet_Categorydescriptor_Gotit2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فهمت`)
};

/**
* | output |
* | --- |
* | "Got it" |
*
* @param {Wallet_Categorydescriptor_Gotit2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_categorydescriptor_gotit2 = /** @type {((inputs?: Wallet_Categorydescriptor_Gotit2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Categorydescriptor_Gotit2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_categorydescriptor_gotit2(inputs)
	if (locale === "es") return es_wallet_categorydescriptor_gotit2(inputs)
	if (locale === "fr") return fr_wallet_categorydescriptor_gotit2(inputs)
	return ar_wallet_categorydescriptor_gotit2(inputs)
});
export { wallet_categorydescriptor_gotit2 as "wallet.categoryDescriptor.gotIt" }