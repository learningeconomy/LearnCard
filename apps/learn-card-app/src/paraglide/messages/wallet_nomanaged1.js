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

const fr_wallet_nomanaged1 = /** @type {(inputs: Wallet_Nomanaged1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun titre géré`)
};

const ar_wallet_nomanaged1 = /** @type {(inputs: Wallet_Nomanaged1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد شهادات مُدارة`)
};

/**
* | output |
* | --- |
* | "No managed credentials" |
*
* @param {Wallet_Nomanaged1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_nomanaged1 = /** @type {((inputs?: Wallet_Nomanaged1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Nomanaged1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_nomanaged1(inputs)
	if (locale === "es") return es_wallet_nomanaged1(inputs)
	if (locale === "fr") return fr_wallet_nomanaged1(inputs)
	return ar_wallet_nomanaged1(inputs)
});
export { wallet_nomanaged1 as "wallet.noManaged" }