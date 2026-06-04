/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_EarnedInputs */

const en_wallet_earned = /** @type {(inputs: Wallet_EarnedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Earned`)
};

const es_wallet_earned = /** @type {(inputs: Wallet_EarnedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Obtenidas`)
};

const de_wallet_earned = /** @type {(inputs: Wallet_EarnedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Erhalten`)
};

const ar_wallet_earned = /** @type {(inputs: Wallet_EarnedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المكتسبة`)
};

const fr_wallet_earned = /** @type {(inputs: Wallet_EarnedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Obtenus`)
};

const ko_wallet_earned = /** @type {(inputs: Wallet_EarnedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`취득`)
};

/**
* | output |
* | --- |
* | "Earned" |
*
* @param {Wallet_EarnedInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const wallet_earned = /** @type {((inputs?: Wallet_EarnedInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_EarnedInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_earned(inputs)
	if (locale === "es") return es_wallet_earned(inputs)
	if (locale === "de") return de_wallet_earned(inputs)
	if (locale === "ar") return ar_wallet_earned(inputs)
	if (locale === "fr") return fr_wallet_earned(inputs)
	return ko_wallet_earned(inputs)
});
export { wallet_earned as "wallet.earned" }