/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_Issuedby1Inputs */

const en_wallet_issuedby1 = /** @type {(inputs: Wallet_Issuedby1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issued by:`)
};

const es_wallet_issuedby1 = /** @type {(inputs: Wallet_Issuedby1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Emitida por:`)
};

const fr_wallet_issuedby1 = /** @type {(inputs: Wallet_Issuedby1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Émis par :`)
};

const ar_wallet_issuedby1 = /** @type {(inputs: Wallet_Issuedby1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`صادرة من:`)
};

/**
* | output |
* | --- |
* | "Issued by:" |
*
* @param {Wallet_Issuedby1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_issuedby1 = /** @type {((inputs?: Wallet_Issuedby1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Issuedby1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_issuedby1(inputs)
	if (locale === "es") return es_wallet_issuedby1(inputs)
	if (locale === "fr") return fr_wallet_issuedby1(inputs)
	return ar_wallet_issuedby1(inputs)
});
export { wallet_issuedby1 as "wallet.issuedBy" }