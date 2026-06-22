/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_Meritbadge1Inputs */

const en_wallet_meritbadge1 = /** @type {(inputs: Wallet_Meritbadge1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Merit Badge`)
};

const es_wallet_meritbadge1 = /** @type {(inputs: Wallet_Meritbadge1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Insignia al mérito`)
};

const fr_wallet_meritbadge1 = /** @type {(inputs: Wallet_Meritbadge1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Badge de mérite`)
};

const ar_wallet_meritbadge1 = /** @type {(inputs: Wallet_Meritbadge1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`شارة الاستحقاق`)
};

/**
* | output |
* | --- |
* | "Merit Badge" |
*
* @param {Wallet_Meritbadge1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_meritbadge1 = /** @type {((inputs?: Wallet_Meritbadge1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Meritbadge1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_meritbadge1(inputs)
	if (locale === "es") return es_wallet_meritbadge1(inputs)
	if (locale === "fr") return fr_wallet_meritbadge1(inputs)
	return ar_wallet_meritbadge1(inputs)
});
export { wallet_meritbadge1 as "wallet.meritBadge" }