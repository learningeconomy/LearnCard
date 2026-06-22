/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_Expirationdate1Inputs */

const en_wallet_expirationdate1 = /** @type {(inputs: Wallet_Expirationdate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Expiration Date`)
};

const es_wallet_expirationdate1 = /** @type {(inputs: Wallet_Expirationdate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fecha de expiración`)
};

const fr_wallet_expirationdate1 = /** @type {(inputs: Wallet_Expirationdate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Date d'expiration`)
};

const ar_wallet_expirationdate1 = /** @type {(inputs: Wallet_Expirationdate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تاريخ الانتهاء`)
};

/**
* | output |
* | --- |
* | "Expiration Date" |
*
* @param {Wallet_Expirationdate1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_expirationdate1 = /** @type {((inputs?: Wallet_Expirationdate1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Expirationdate1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_expirationdate1(inputs)
	if (locale === "es") return es_wallet_expirationdate1(inputs)
	if (locale === "fr") return fr_wallet_expirationdate1(inputs)
	return ar_wallet_expirationdate1(inputs)
});
export { wallet_expirationdate1 as "wallet.expirationDate" }