/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_Categoriessingular_Ids1Inputs */

const en_wallet_categoriessingular_ids1 = /** @type {(inputs: Wallet_Categoriessingular_Ids1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ID`)
};

const es_wallet_categoriessingular_ids1 = /** @type {(inputs: Wallet_Categoriessingular_Ids1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Identificación`)
};

const fr_wallet_categoriessingular_ids1 = /** @type {(inputs: Wallet_Categoriessingular_Ids1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Identifiant`)
};

const ar_wallet_categoriessingular_ids1 = /** @type {(inputs: Wallet_Categoriessingular_Ids1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هوية`)
};

/**
* | output |
* | --- |
* | "ID" |
*
* @param {Wallet_Categoriessingular_Ids1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_categoriessingular_ids1 = /** @type {((inputs?: Wallet_Categoriessingular_Ids1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Categoriessingular_Ids1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_categoriessingular_ids1(inputs)
	if (locale === "es") return es_wallet_categoriessingular_ids1(inputs)
	if (locale === "fr") return fr_wallet_categoriessingular_ids1(inputs)
	return ar_wallet_categoriessingular_ids1(inputs)
});
export { wallet_categoriessingular_ids1 as "wallet.categoriesSingular.ids" }