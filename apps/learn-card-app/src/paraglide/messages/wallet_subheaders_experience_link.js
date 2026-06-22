/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_Subheaders_Experience_LinkInputs */

const en_wallet_subheaders_experience_link = /** @type {(inputs: Wallet_Subheaders_Experience_LinkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`work experiences`)
};

const es_wallet_subheaders_experience_link = /** @type {(inputs: Wallet_Subheaders_Experience_LinkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`experiencias laborales`)
};

const fr_wallet_subheaders_experience_link = /** @type {(inputs: Wallet_Subheaders_Experience_LinkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`expériences professionnelles`)
};

const ar_wallet_subheaders_experience_link = /** @type {(inputs: Wallet_Subheaders_Experience_LinkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`خبراتك المهنية`)
};

/**
* | output |
* | --- |
* | "work experiences" |
*
* @param {Wallet_Subheaders_Experience_LinkInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_subheaders_experience_link = /** @type {((inputs?: Wallet_Subheaders_Experience_LinkInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Subheaders_Experience_LinkInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_subheaders_experience_link(inputs)
	if (locale === "es") return es_wallet_subheaders_experience_link(inputs)
	if (locale === "fr") return fr_wallet_subheaders_experience_link(inputs)
	return ar_wallet_subheaders_experience_link(inputs)
});
export { wallet_subheaders_experience_link as "wallet.subheaders.experience.link" }