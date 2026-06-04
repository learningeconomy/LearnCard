/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_Expiredid1Inputs */

const en_wallet_expiredid1 = /** @type {(inputs: Wallet_Expiredid1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Expired ID`)
};

const es_wallet_expiredid1 = /** @type {(inputs: Wallet_Expiredid1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Identificación expirada`)
};

const de_wallet_expiredid1 = /** @type {(inputs: Wallet_Expiredid1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Abgelaufener Ausweis`)
};

const ar_wallet_expiredid1 = /** @type {(inputs: Wallet_Expiredid1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هوية منتهية الصلاحية`)
};

const fr_wallet_expiredid1 = /** @type {(inputs: Wallet_Expiredid1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Identifiant expiré`)
};

const ko_wallet_expiredid1 = /** @type {(inputs: Wallet_Expiredid1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`만료된 ID`)
};

/**
* | output |
* | --- |
* | "Expired ID" |
*
* @param {Wallet_Expiredid1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const wallet_expiredid1 = /** @type {((inputs?: Wallet_Expiredid1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Expiredid1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_expiredid1(inputs)
	if (locale === "es") return es_wallet_expiredid1(inputs)
	if (locale === "de") return de_wallet_expiredid1(inputs)
	if (locale === "ar") return ar_wallet_expiredid1(inputs)
	if (locale === "fr") return fr_wallet_expiredid1(inputs)
	return ko_wallet_expiredid1(inputs)
});
export { wallet_expiredid1 as "wallet.expiredId" }