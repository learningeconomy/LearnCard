/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_Subheaders_Socialbadge_Lead1Inputs */

const en_wallet_subheaders_socialbadge_lead1 = /** @type {(inputs: Wallet_Subheaders_Socialbadge_Lead1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your`)
};

const es_wallet_subheaders_socialbadge_lead1 = /** @type {(inputs: Wallet_Subheaders_Socialbadge_Lead1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tus`)
};

const fr_wallet_subheaders_socialbadge_lead1 = /** @type {(inputs: Wallet_Subheaders_Socialbadge_Lead1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vos`)
};

const ar_wallet_subheaders_socialbadge_lead1 = /** @type {(inputs: Wallet_Subheaders_Socialbadge_Lead1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (``)
};

/**
* | output |
* | --- |
* | "Your" |
*
* @param {Wallet_Subheaders_Socialbadge_Lead1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_subheaders_socialbadge_lead1 = /** @type {((inputs?: Wallet_Subheaders_Socialbadge_Lead1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Subheaders_Socialbadge_Lead1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_subheaders_socialbadge_lead1(inputs)
	if (locale === "es") return es_wallet_subheaders_socialbadge_lead1(inputs)
	if (locale === "fr") return fr_wallet_subheaders_socialbadge_lead1(inputs)
	return ar_wallet_subheaders_socialbadge_lead1(inputs)
});
export { wallet_subheaders_socialbadge_lead1 as "wallet.subheaders.socialBadge.lead" }