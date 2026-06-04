/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_Issuedate1Inputs */

const en_wallet_issuedate1 = /** @type {(inputs: Wallet_Issuedate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issue Date`)
};

const es_wallet_issuedate1 = /** @type {(inputs: Wallet_Issuedate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fecha de emisión`)
};

const de_wallet_issuedate1 = /** @type {(inputs: Wallet_Issuedate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ausstellungsdatum`)
};

const ar_wallet_issuedate1 = /** @type {(inputs: Wallet_Issuedate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تاريخ الإصدار`)
};

const fr_wallet_issuedate1 = /** @type {(inputs: Wallet_Issuedate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Date d'émission`)
};

const ko_wallet_issuedate1 = /** @type {(inputs: Wallet_Issuedate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`발급일`)
};

/**
* | output |
* | --- |
* | "Issue Date" |
*
* @param {Wallet_Issuedate1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const wallet_issuedate1 = /** @type {((inputs?: Wallet_Issuedate1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Issuedate1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_issuedate1(inputs)
	if (locale === "es") return es_wallet_issuedate1(inputs)
	if (locale === "de") return de_wallet_issuedate1(inputs)
	if (locale === "ar") return ar_wallet_issuedate1(inputs)
	if (locale === "fr") return fr_wallet_issuedate1(inputs)
	return ko_wallet_issuedate1(inputs)
});
export { wallet_issuedate1 as "wallet.issueDate" }