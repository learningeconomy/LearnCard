/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Boost_Walletnotinitialized2Inputs */

const en_toasts_boost_walletnotinitialized2 = /** @type {(inputs: Toasts_Boost_Walletnotinitialized2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Wallet is not initialized`)
};

const es_toasts_boost_walletnotinitialized2 = /** @type {(inputs: Toasts_Boost_Walletnotinitialized2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`La billetera no está inicializada`)
};

const de_toasts_boost_walletnotinitialized2 = /** @type {(inputs: Toasts_Boost_Walletnotinitialized2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Wallet ist nicht initialisiert`)
};

const ar_toasts_boost_walletnotinitialized2 = /** @type {(inputs: Toasts_Boost_Walletnotinitialized2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المحفظة غير مهيأة`)
};

const fr_toasts_boost_walletnotinitialized2 = /** @type {(inputs: Toasts_Boost_Walletnotinitialized2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Le portefeuille n'est pas initialisé`)
};

const ko_toasts_boost_walletnotinitialized2 = /** @type {(inputs: Toasts_Boost_Walletnotinitialized2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`지갑이 초기화되지 않았습니다`)
};

/**
* | output |
* | --- |
* | "Wallet is not initialized" |
*
* @param {Toasts_Boost_Walletnotinitialized2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const toasts_boost_walletnotinitialized2 = /** @type {((inputs?: Toasts_Boost_Walletnotinitialized2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Boost_Walletnotinitialized2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_boost_walletnotinitialized2(inputs)
	if (locale === "es") return es_toasts_boost_walletnotinitialized2(inputs)
	if (locale === "de") return de_toasts_boost_walletnotinitialized2(inputs)
	if (locale === "ar") return ar_toasts_boost_walletnotinitialized2(inputs)
	if (locale === "fr") return fr_toasts_boost_walletnotinitialized2(inputs)
	return ko_toasts_boost_walletnotinitialized2(inputs)
});
export { toasts_boost_walletnotinitialized2 as "toasts.boost.walletNotInitialized" }