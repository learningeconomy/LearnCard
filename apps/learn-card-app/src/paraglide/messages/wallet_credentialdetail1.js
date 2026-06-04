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

const de_wallet_credentialdetail1 = /** @type {(inputs: Wallet_Credentialdetail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Berechtigungsdaten`)
};

const ar_wallet_credentialdetail1 = /** @type {(inputs: Wallet_Credentialdetail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تفاصيل الشهادة`)
};

const fr_wallet_credentialdetail1 = /** @type {(inputs: Wallet_Credentialdetail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Détail du titre`)
};

const ko_wallet_credentialdetail1 = /** @type {(inputs: Wallet_Credentialdetail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`자격증명 상세`)
};

/**
* | output |
* | --- |
* | "Credential Detail" |
*
* @param {Wallet_Credentialdetail1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const wallet_credentialdetail1 = /** @type {((inputs?: Wallet_Credentialdetail1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Credentialdetail1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_credentialdetail1(inputs)
	if (locale === "es") return es_wallet_credentialdetail1(inputs)
	if (locale === "de") return de_wallet_credentialdetail1(inputs)
	if (locale === "ar") return ar_wallet_credentialdetail1(inputs)
	if (locale === "fr") return fr_wallet_credentialdetail1(inputs)
	return ko_wallet_credentialdetail1(inputs)
});
export { wallet_credentialdetail1 as "wallet.credentialDetail" }