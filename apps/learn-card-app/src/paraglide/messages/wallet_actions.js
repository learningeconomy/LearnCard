/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_ActionsInputs */

const en_wallet_actions = /** @type {(inputs: Wallet_ActionsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Actions`)
};

const es_wallet_actions = /** @type {(inputs: Wallet_ActionsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Acciones`)
};

const de_wallet_actions = /** @type {(inputs: Wallet_ActionsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aktionen`)
};

const ar_wallet_actions = /** @type {(inputs: Wallet_ActionsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الإجراءات`)
};

const fr_wallet_actions = /** @type {(inputs: Wallet_ActionsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Actions`)
};

const ko_wallet_actions = /** @type {(inputs: Wallet_ActionsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`작업`)
};

/**
* | output |
* | --- |
* | "Actions" |
*
* @param {Wallet_ActionsInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const wallet_actions = /** @type {((inputs?: Wallet_ActionsInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_ActionsInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_actions(inputs)
	if (locale === "es") return es_wallet_actions(inputs)
	if (locale === "de") return de_wallet_actions(inputs)
	if (locale === "ar") return ar_wallet_actions(inputs)
	if (locale === "fr") return fr_wallet_actions(inputs)
	return ko_wallet_actions(inputs)
});
export { wallet_actions as "wallet.actions" }