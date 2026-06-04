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

const de_wallet_credentialcount1 = /** @type {(inputs: Wallet_Credentialcount1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} Berechtigung(en)`)
};

const ar_wallet_credentialcount1 = /** @type {(inputs: Wallet_Credentialcount1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} شهادة(شهادات)`)
};

const fr_wallet_credentialcount1 = /** @type {(inputs: Wallet_Credentialcount1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} titre(s)`)
};

const ko_wallet_credentialcount1 = /** @type {(inputs: Wallet_Credentialcount1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`자격증명 ${i?.count}개`)
};

/**
* | output |
* | --- |
* | "{count} credential(s)" |
*
* @param {Wallet_Credentialcount1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const wallet_credentialcount1 = /** @type {((inputs: Wallet_Credentialcount1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Credentialcount1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_credentialcount1(inputs)
	if (locale === "es") return es_wallet_credentialcount1(inputs)
	if (locale === "de") return de_wallet_credentialcount1(inputs)
	if (locale === "ar") return ar_wallet_credentialcount1(inputs)
	if (locale === "fr") return fr_wallet_credentialcount1(inputs)
	return ko_wallet_credentialcount1(inputs)
});
export { wallet_credentialcount1 as "wallet.credentialCount" }