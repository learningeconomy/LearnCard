/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ percent: NonNullable<unknown> }} Wallet_Subheaders_Aisessions_Optimized1Inputs */

const en_wallet_subheaders_aisessions_optimized1 = /** @type {(inputs: Wallet_Subheaders_Aisessions_Optimized1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.percent}% Optimized`)
};

const es_wallet_subheaders_aisessions_optimized1 = /** @type {(inputs: Wallet_Subheaders_Aisessions_Optimized1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.percent}% optimizado`)
};

const fr_wallet_subheaders_aisessions_optimized1 = /** @type {(inputs: Wallet_Subheaders_Aisessions_Optimized1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.percent}% optimisé`)
};

const ar_wallet_subheaders_aisessions_optimized1 = /** @type {(inputs: Wallet_Subheaders_Aisessions_Optimized1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.percent}% مُحسّن`)
};

/**
* | output |
* | --- |
* | "{percent}% Optimized" |
*
* @param {Wallet_Subheaders_Aisessions_Optimized1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_subheaders_aisessions_optimized1 = /** @type {((inputs: Wallet_Subheaders_Aisessions_Optimized1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Subheaders_Aisessions_Optimized1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_subheaders_aisessions_optimized1(inputs)
	if (locale === "es") return es_wallet_subheaders_aisessions_optimized1(inputs)
	if (locale === "fr") return fr_wallet_subheaders_aisessions_optimized1(inputs)
	return ar_wallet_subheaders_aisessions_optimized1(inputs)
});
export { wallet_subheaders_aisessions_optimized1 as "wallet.subheaders.aiSessions.optimized" }