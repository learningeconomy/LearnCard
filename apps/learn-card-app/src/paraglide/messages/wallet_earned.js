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

const fr_wallet_earned = /** @type {(inputs: Wallet_EarnedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Obtenus`)
};

const ar_wallet_earned = /** @type {(inputs: Wallet_EarnedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المكتسبة`)
};

/**
* | output |
* | --- |
* | "Earned" |
*
* @param {Wallet_EarnedInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_earned = /** @type {((inputs?: Wallet_EarnedInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_EarnedInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_earned(inputs)
	if (locale === "es") return es_wallet_earned(inputs)
	if (locale === "fr") return fr_wallet_earned(inputs)
	return ar_wallet_earned(inputs)
});
export { wallet_earned as "wallet.earned" }