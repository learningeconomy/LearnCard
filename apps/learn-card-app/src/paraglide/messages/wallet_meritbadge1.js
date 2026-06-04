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

const de_wallet_meritbadge1 = /** @type {(inputs: Wallet_Meritbadge1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verdienstabzeichen`)
};

const ar_wallet_meritbadge1 = /** @type {(inputs: Wallet_Meritbadge1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`شارة الاستحقاق`)
};

const fr_wallet_meritbadge1 = /** @type {(inputs: Wallet_Meritbadge1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Badge de mérite`)
};

const ko_wallet_meritbadge1 = /** @type {(inputs: Wallet_Meritbadge1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`공로 배지`)
};

/**
* | output |
* | --- |
* | "Merit Badge" |
*
* @param {Wallet_Meritbadge1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const wallet_meritbadge1 = /** @type {((inputs?: Wallet_Meritbadge1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Meritbadge1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_meritbadge1(inputs)
	if (locale === "es") return es_wallet_meritbadge1(inputs)
	if (locale === "de") return de_wallet_meritbadge1(inputs)
	if (locale === "ar") return ar_wallet_meritbadge1(inputs)
	if (locale === "fr") return fr_wallet_meritbadge1(inputs)
	return ko_wallet_meritbadge1(inputs)
});
export { wallet_meritbadge1 as "wallet.meritBadge" }