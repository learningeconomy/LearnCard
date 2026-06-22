/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Wallet_Categorydescriptor_About1Inputs */

const en_wallet_categorydescriptor_about1 = /** @type {(inputs: Wallet_Categorydescriptor_About1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`About ${i?.name}`)
};

const es_wallet_categorydescriptor_about1 = /** @type {(inputs: Wallet_Categorydescriptor_About1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Acerca de ${i?.name}`)
};

const fr_wallet_categorydescriptor_about1 = /** @type {(inputs: Wallet_Categorydescriptor_About1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`À propos de ${i?.name}`)
};

const ar_wallet_categorydescriptor_about1 = /** @type {(inputs: Wallet_Categorydescriptor_About1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`حول ${i?.name}`)
};

/**
* | output |
* | --- |
* | "About {name}" |
*
* @param {Wallet_Categorydescriptor_About1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_categorydescriptor_about1 = /** @type {((inputs: Wallet_Categorydescriptor_About1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Categorydescriptor_About1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_categorydescriptor_about1(inputs)
	if (locale === "es") return es_wallet_categorydescriptor_about1(inputs)
	if (locale === "fr") return fr_wallet_categorydescriptor_about1(inputs)
	return ar_wallet_categorydescriptor_about1(inputs)
});
export { wallet_categorydescriptor_about1 as "wallet.categoryDescriptor.about" }