/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_Categories_AssistanceInputs */

const en_wallet_categories_assistance = /** @type {(inputs: Wallet_Categories_AssistanceInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Assistance`)
};

const es_wallet_categories_assistance = /** @type {(inputs: Wallet_Categories_AssistanceInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Asistencia`)
};

const de_wallet_categories_assistance = /** @type {(inputs: Wallet_Categories_AssistanceInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Hilfe`)
};

const ar_wallet_categories_assistance = /** @type {(inputs: Wallet_Categories_AssistanceInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المساعدة`)
};

const fr_wallet_categories_assistance = /** @type {(inputs: Wallet_Categories_AssistanceInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Assistance`)
};

const ko_wallet_categories_assistance = /** @type {(inputs: Wallet_Categories_AssistanceInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`지원`)
};

/**
* | output |
* | --- |
* | "Assistance" |
*
* @param {Wallet_Categories_AssistanceInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const wallet_categories_assistance = /** @type {((inputs?: Wallet_Categories_AssistanceInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Categories_AssistanceInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_categories_assistance(inputs)
	if (locale === "es") return es_wallet_categories_assistance(inputs)
	if (locale === "de") return de_wallet_categories_assistance(inputs)
	if (locale === "ar") return ar_wallet_categories_assistance(inputs)
	if (locale === "fr") return fr_wallet_categories_assistance(inputs)
	return ko_wallet_categories_assistance(inputs)
});
export { wallet_categories_assistance as "wallet.categories.assistance" }