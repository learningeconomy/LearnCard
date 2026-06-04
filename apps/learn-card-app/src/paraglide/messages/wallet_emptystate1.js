/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_Emptystate1Inputs */

const en_wallet_emptystate1 = /** @type {(inputs: Wallet_Emptystate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No credentials yet`)
};

const es_wallet_emptystate1 = /** @type {(inputs: Wallet_Emptystate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún no hay credenciales`)
};

const de_wallet_emptystate1 = /** @type {(inputs: Wallet_Emptystate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Noch keine Berechtigungen`)
};

const ar_wallet_emptystate1 = /** @type {(inputs: Wallet_Emptystate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد شهادات بعد`)
};

const fr_wallet_emptystate1 = /** @type {(inputs: Wallet_Emptystate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun titre pour le moment`)
};

const ko_wallet_emptystate1 = /** @type {(inputs: Wallet_Emptystate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`아직 자격증명이 없습니다`)
};

/**
* | output |
* | --- |
* | "No credentials yet" |
*
* @param {Wallet_Emptystate1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const wallet_emptystate1 = /** @type {((inputs?: Wallet_Emptystate1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Emptystate1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_emptystate1(inputs)
	if (locale === "es") return es_wallet_emptystate1(inputs)
	if (locale === "de") return de_wallet_emptystate1(inputs)
	if (locale === "ar") return ar_wallet_emptystate1(inputs)
	if (locale === "fr") return fr_wallet_emptystate1(inputs)
	return ko_wallet_emptystate1(inputs)
});
export { wallet_emptystate1 as "wallet.emptyState" }