/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_StatusInputs */

const en_wallet_status = /** @type {(inputs: Wallet_StatusInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Status`)
};

const es_wallet_status = /** @type {(inputs: Wallet_StatusInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Estado`)
};

const de_wallet_status = /** @type {(inputs: Wallet_StatusInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Status`)
};

const ar_wallet_status = /** @type {(inputs: Wallet_StatusInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الحالة`)
};

const fr_wallet_status = /** @type {(inputs: Wallet_StatusInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Statut`)
};

const ko_wallet_status = /** @type {(inputs: Wallet_StatusInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`상태`)
};

/**
* | output |
* | --- |
* | "Status" |
*
* @param {Wallet_StatusInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const wallet_status = /** @type {((inputs?: Wallet_StatusInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_StatusInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_status(inputs)
	if (locale === "es") return es_wallet_status(inputs)
	if (locale === "de") return de_wallet_status(inputs)
	if (locale === "ar") return ar_wallet_status(inputs)
	if (locale === "fr") return fr_wallet_status(inputs)
	return ko_wallet_status(inputs)
});
export { wallet_status as "wallet.status" }