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

const de_wallet_gridview1 = /** @type {(inputs: Wallet_Gridview1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Raster`)
};

const ar_wallet_gridview1 = /** @type {(inputs: Wallet_Gridview1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`شبكة`)
};

const fr_wallet_gridview1 = /** @type {(inputs: Wallet_Gridview1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Grille`)
};

const ko_wallet_gridview1 = /** @type {(inputs: Wallet_Gridview1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`그리드`)
};

/**
* | output |
* | --- |
* | "Grid" |
*
* @param {Wallet_Gridview1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const wallet_gridview1 = /** @type {((inputs?: Wallet_Gridview1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Gridview1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_gridview1(inputs)
	if (locale === "es") return es_wallet_gridview1(inputs)
	if (locale === "de") return de_wallet_gridview1(inputs)
	if (locale === "ar") return ar_wallet_gridview1(inputs)
	if (locale === "fr") return fr_wallet_gridview1(inputs)
	return ko_wallet_gridview1(inputs)
});
export { wallet_gridview1 as "wallet.gridView" }