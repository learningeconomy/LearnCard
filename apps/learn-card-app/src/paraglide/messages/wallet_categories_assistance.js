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
	return /** @type {LocalizedString} */ (`Unterstützung`)
};

const ar_wallet_categories_assistance = /** @type {(inputs: Wallet_Categories_AssistanceInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المساعدة`)
};

/**
* | output |
* | --- |
* | "Assistance" |
*
* @param {Wallet_Categories_AssistanceInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_categories_assistance = /** @type {((inputs?: Wallet_Categories_AssistanceInputs, options?: { locale?: "en" | "es" | "de" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Categories_AssistanceInputs, { locale?: "en" | "es" | "de" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_categories_assistance(inputs)
	if (locale === "es") return es_wallet_categories_assistance(inputs)
	if (locale === "de") return de_wallet_categories_assistance(inputs)
	return ar_wallet_categories_assistance(inputs)
});
export { wallet_categories_assistance as "wallet.categories.assistance" }