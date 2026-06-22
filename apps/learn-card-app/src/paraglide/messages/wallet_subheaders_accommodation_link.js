/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_Subheaders_Accommodation_LinkInputs */

const en_wallet_subheaders_accommodation_link = /** @type {(inputs: Wallet_Subheaders_Accommodation_LinkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`support and adjustments`)
};

const es_wallet_subheaders_accommodation_link = /** @type {(inputs: Wallet_Subheaders_Accommodation_LinkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`apoyos y ajustes`)
};

const fr_wallet_subheaders_accommodation_link = /** @type {(inputs: Wallet_Subheaders_Accommodation_LinkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`soutiens et aménagements`)
};

const ar_wallet_subheaders_accommodation_link = /** @type {(inputs: Wallet_Subheaders_Accommodation_LinkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الدعم والتسهيلات الخاصة بك`)
};

/**
* | output |
* | --- |
* | "support and adjustments" |
*
* @param {Wallet_Subheaders_Accommodation_LinkInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_subheaders_accommodation_link = /** @type {((inputs?: Wallet_Subheaders_Accommodation_LinkInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Subheaders_Accommodation_LinkInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_subheaders_accommodation_link(inputs)
	if (locale === "es") return es_wallet_subheaders_accommodation_link(inputs)
	if (locale === "fr") return fr_wallet_subheaders_accommodation_link(inputs)
	return ar_wallet_subheaders_accommodation_link(inputs)
});
export { wallet_subheaders_accommodation_link as "wallet.subheaders.accommodation.link" }