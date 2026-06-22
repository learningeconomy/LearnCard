/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_Credentialdetail1Inputs */

const en_wallet_credentialdetail1 = /** @type {(inputs: Wallet_Credentialdetail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credential Detail`)
};

const es_wallet_credentialdetail1 = /** @type {(inputs: Wallet_Credentialdetail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Detalle de credencial`)
};

const fr_wallet_credentialdetail1 = /** @type {(inputs: Wallet_Credentialdetail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Détail du titre`)
};

const ar_wallet_credentialdetail1 = /** @type {(inputs: Wallet_Credentialdetail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تفاصيل الشهادة`)
};

/**
* | output |
* | --- |
* | "Credential Detail" |
*
* @param {Wallet_Credentialdetail1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_credentialdetail1 = /** @type {((inputs?: Wallet_Credentialdetail1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Credentialdetail1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_credentialdetail1(inputs)
	if (locale === "es") return es_wallet_credentialdetail1(inputs)
	if (locale === "fr") return fr_wallet_credentialdetail1(inputs)
	return ar_wallet_credentialdetail1(inputs)
});
export { wallet_credentialdetail1 as "wallet.credentialDetail" }