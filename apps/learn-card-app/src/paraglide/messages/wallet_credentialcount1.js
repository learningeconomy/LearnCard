/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Wallet_Credentialcount1Inputs */

const en_wallet_credentialcount1 = /** @type {(inputs: Wallet_Credentialcount1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} credential(s)`)
};

const es_wallet_credentialcount1 = /** @type {(inputs: Wallet_Credentialcount1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} credencial(es)`)
};

const fr_wallet_credentialcount1 = /** @type {(inputs: Wallet_Credentialcount1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} titre(s)`)
};

const ar_wallet_credentialcount1 = /** @type {(inputs: Wallet_Credentialcount1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} شهادة(شهادات)`)
};

/**
* | output |
* | --- |
* | "{count} credential(s)" |
*
* @param {Wallet_Credentialcount1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_credentialcount1 = /** @type {((inputs: Wallet_Credentialcount1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Credentialcount1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_credentialcount1(inputs)
	if (locale === "es") return es_wallet_credentialcount1(inputs)
	if (locale === "fr") return fr_wallet_credentialcount1(inputs)
	return ar_wallet_credentialcount1(inputs)
});
export { wallet_credentialcount1 as "wallet.credentialCount" }