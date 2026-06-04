/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_Deletecredential1Inputs */

const en_wallet_deletecredential1 = /** @type {(inputs: Wallet_Deletecredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Delete`)
};

const es_wallet_deletecredential1 = /** @type {(inputs: Wallet_Deletecredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Eliminar`)
};

const de_wallet_deletecredential1 = /** @type {(inputs: Wallet_Deletecredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Löschen`)
};

const ar_wallet_deletecredential1 = /** @type {(inputs: Wallet_Deletecredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حذف`)
};

const fr_wallet_deletecredential1 = /** @type {(inputs: Wallet_Deletecredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Supprimer`)
};

const ko_wallet_deletecredential1 = /** @type {(inputs: Wallet_Deletecredential1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`삭제`)
};

/**
* | output |
* | --- |
* | "Delete" |
*
* @param {Wallet_Deletecredential1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const wallet_deletecredential1 = /** @type {((inputs?: Wallet_Deletecredential1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Deletecredential1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_deletecredential1(inputs)
	if (locale === "es") return es_wallet_deletecredential1(inputs)
	if (locale === "de") return de_wallet_deletecredential1(inputs)
	if (locale === "ar") return ar_wallet_deletecredential1(inputs)
	if (locale === "fr") return fr_wallet_deletecredential1(inputs)
	return ko_wallet_deletecredential1(inputs)
});
export { wallet_deletecredential1 as "wallet.deleteCredential" }