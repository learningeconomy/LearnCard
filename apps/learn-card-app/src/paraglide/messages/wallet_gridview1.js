/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_Gridview1Inputs */

const en_wallet_gridview1 = /** @type {(inputs: Wallet_Gridview1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Grid`)
};

const es_wallet_gridview1 = /** @type {(inputs: Wallet_Gridview1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cuadrícula`)
};

const fr_wallet_gridview1 = /** @type {(inputs: Wallet_Gridview1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Grille`)
};

const ar_wallet_gridview1 = /** @type {(inputs: Wallet_Gridview1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`شبكة`)
};

/**
* | output |
* | --- |
* | "Grid" |
*
* @param {Wallet_Gridview1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_gridview1 = /** @type {((inputs?: Wallet_Gridview1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Gridview1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_gridview1(inputs)
	if (locale === "es") return es_wallet_gridview1(inputs)
	if (locale === "fr") return fr_wallet_gridview1(inputs)
	return ar_wallet_gridview1(inputs)
});
export { wallet_gridview1 as "wallet.gridView" }