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

const fr_wallet_issuedate1 = /** @type {(inputs: Wallet_Issuedate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Date d'émission`)
};

const ar_wallet_issuedate1 = /** @type {(inputs: Wallet_Issuedate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تاريخ الإصدار`)
};

/**
* | output |
* | --- |
* | "Issue Date" |
*
* @param {Wallet_Issuedate1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_issuedate1 = /** @type {((inputs?: Wallet_Issuedate1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Issuedate1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_issuedate1(inputs)
	if (locale === "es") return es_wallet_issuedate1(inputs)
	if (locale === "fr") return fr_wallet_issuedate1(inputs)
	return ar_wallet_issuedate1(inputs)
});
export { wallet_issuedate1 as "wallet.issueDate" }