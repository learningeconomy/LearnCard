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

const de_wallet_expirationdate1 = /** @type {(inputs: Wallet_Expirationdate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ablaufdatum`)
};

const ar_wallet_expirationdate1 = /** @type {(inputs: Wallet_Expirationdate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تاريخ الانتهاء`)
};

const fr_wallet_expirationdate1 = /** @type {(inputs: Wallet_Expirationdate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Date d'expiration`)
};

const ko_wallet_expirationdate1 = /** @type {(inputs: Wallet_Expirationdate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`만료일`)
};

/**
* | output |
* | --- |
* | "Expiration Date" |
*
* @param {Wallet_Expirationdate1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const wallet_expirationdate1 = /** @type {((inputs?: Wallet_Expirationdate1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Expirationdate1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_expirationdate1(inputs)
	if (locale === "es") return es_wallet_expirationdate1(inputs)
	if (locale === "de") return de_wallet_expirationdate1(inputs)
	if (locale === "ar") return ar_wallet_expirationdate1(inputs)
	if (locale === "fr") return fr_wallet_expirationdate1(inputs)
	return ko_wallet_expirationdate1(inputs)
});
export { wallet_expirationdate1 as "wallet.expirationDate" }