/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_Nomanaged1Inputs */

const en_wallet_nomanaged1 = /** @type {(inputs: Wallet_Nomanaged1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No managed credentials`)
};

const es_wallet_nomanaged1 = /** @type {(inputs: Wallet_Nomanaged1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sin credenciales gestionadas`)
};

const de_wallet_nomanaged1 = /** @type {(inputs: Wallet_Nomanaged1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Keine verwalteten Berechtigungen`)
};

const ar_wallet_nomanaged1 = /** @type {(inputs: Wallet_Nomanaged1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد شهادات مُدارة`)
};

const fr_wallet_nomanaged1 = /** @type {(inputs: Wallet_Nomanaged1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun titre géré`)
};

const ko_wallet_nomanaged1 = /** @type {(inputs: Wallet_Nomanaged1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`관리 중인 자격증명 없음`)
};

/**
* | output |
* | --- |
* | "No managed credentials" |
*
* @param {Wallet_Nomanaged1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const wallet_nomanaged1 = /** @type {((inputs?: Wallet_Nomanaged1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Nomanaged1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_nomanaged1(inputs)
	if (locale === "es") return es_wallet_nomanaged1(inputs)
	if (locale === "de") return de_wallet_nomanaged1(inputs)
	if (locale === "ar") return ar_wallet_nomanaged1(inputs)
	if (locale === "fr") return fr_wallet_nomanaged1(inputs)
	return ko_wallet_nomanaged1(inputs)
});
export { wallet_nomanaged1 as "wallet.noManaged" }