/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_IssuanceInputs */

const en_wallet_issuance = /** @type {(inputs: Wallet_IssuanceInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issuance`)
};

const es_wallet_issuance = /** @type {(inputs: Wallet_IssuanceInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Emisión`)
};

const fr_wallet_issuance = /** @type {(inputs: Wallet_IssuanceInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Émission`)
};

const ar_wallet_issuance = /** @type {(inputs: Wallet_IssuanceInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الإصدار`)
};

/**
* | output |
* | --- |
* | "Issuance" |
*
* @param {Wallet_IssuanceInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_issuance = /** @type {((inputs?: Wallet_IssuanceInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_IssuanceInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_issuance(inputs)
	if (locale === "es") return es_wallet_issuance(inputs)
	if (locale === "fr") return fr_wallet_issuance(inputs)
	return ar_wallet_issuance(inputs)
});
export { wallet_issuance as "wallet.issuance" }