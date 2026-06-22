/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_Categoriessingular_Aisessions2Inputs */

const en_wallet_categoriessingular_aisessions2 = /** @type {(inputs: Wallet_Categoriessingular_Aisessions2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`AI Session`)
};

const es_wallet_categoriessingular_aisessions2 = /** @type {(inputs: Wallet_Categoriessingular_Aisessions2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sesión de IA`)
};

const fr_wallet_categoriessingular_aisessions2 = /** @type {(inputs: Wallet_Categoriessingular_Aisessions2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Session IA`)
};

const ar_wallet_categoriessingular_aisessions2 = /** @type {(inputs: Wallet_Categoriessingular_Aisessions2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جلسة ذكاء اصطناعي`)
};

/**
* | output |
* | --- |
* | "AI Session" |
*
* @param {Wallet_Categoriessingular_Aisessions2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_categoriessingular_aisessions2 = /** @type {((inputs?: Wallet_Categoriessingular_Aisessions2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Categoriessingular_Aisessions2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_categoriessingular_aisessions2(inputs)
	if (locale === "es") return es_wallet_categoriessingular_aisessions2(inputs)
	if (locale === "fr") return fr_wallet_categoriessingular_aisessions2(inputs)
	return ar_wallet_categoriessingular_aisessions2(inputs)
});
export { wallet_categoriessingular_aisessions2 as "wallet.categoriesSingular.aiSessions" }