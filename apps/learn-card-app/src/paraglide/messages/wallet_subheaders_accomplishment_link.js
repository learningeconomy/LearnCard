/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_Subheaders_Accomplishment_LinkInputs */

const en_wallet_subheaders_accomplishment_link = /** @type {(inputs: Wallet_Subheaders_Accomplishment_LinkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`accomplishments`)
};

const es_wallet_subheaders_accomplishment_link = /** @type {(inputs: Wallet_Subheaders_Accomplishment_LinkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`logros`)
};

const fr_wallet_subheaders_accomplishment_link = /** @type {(inputs: Wallet_Subheaders_Accomplishment_LinkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`accomplissements`)
};

const ar_wallet_subheaders_accomplishment_link = /** @type {(inputs: Wallet_Subheaders_Accomplishment_LinkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنجازاتك`)
};

/**
* | output |
* | --- |
* | "accomplishments" |
*
* @param {Wallet_Subheaders_Accomplishment_LinkInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_subheaders_accomplishment_link = /** @type {((inputs?: Wallet_Subheaders_Accomplishment_LinkInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Subheaders_Accomplishment_LinkInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_subheaders_accomplishment_link(inputs)
	if (locale === "es") return es_wallet_subheaders_accomplishment_link(inputs)
	if (locale === "fr") return fr_wallet_subheaders_accomplishment_link(inputs)
	return ar_wallet_subheaders_accomplishment_link(inputs)
});
export { wallet_subheaders_accomplishment_link as "wallet.subheaders.accomplishment.link" }