/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_Subheaders_Achievement_LeadInputs */

const en_wallet_subheaders_achievement_lead = /** @type {(inputs: Wallet_Subheaders_Achievement_LeadInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your`)
};

const es_wallet_subheaders_achievement_lead = /** @type {(inputs: Wallet_Subheaders_Achievement_LeadInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tus`)
};

const fr_wallet_subheaders_achievement_lead = /** @type {(inputs: Wallet_Subheaders_Achievement_LeadInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vos`)
};

const ar_wallet_subheaders_achievement_lead = /** @type {(inputs: Wallet_Subheaders_Achievement_LeadInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (``)
};

/**
* | output |
* | --- |
* | "Your" |
*
* @param {Wallet_Subheaders_Achievement_LeadInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_subheaders_achievement_lead = /** @type {((inputs?: Wallet_Subheaders_Achievement_LeadInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Subheaders_Achievement_LeadInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_subheaders_achievement_lead(inputs)
	if (locale === "es") return es_wallet_subheaders_achievement_lead(inputs)
	if (locale === "fr") return fr_wallet_subheaders_achievement_lead(inputs)
	return ar_wallet_subheaders_achievement_lead(inputs)
});
export { wallet_subheaders_achievement_lead as "wallet.subheaders.achievement.lead" }