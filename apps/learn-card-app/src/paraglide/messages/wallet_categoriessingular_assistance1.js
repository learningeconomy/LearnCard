/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_Categoriessingular_Assistance1Inputs */

const en_wallet_categoriessingular_assistance1 = /** @type {(inputs: Wallet_Categoriessingular_Assistance1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Assistance`)
};

const es_wallet_categoriessingular_assistance1 = /** @type {(inputs: Wallet_Categoriessingular_Assistance1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Asistencia`)
};

const fr_wallet_categoriessingular_assistance1 = /** @type {(inputs: Wallet_Categoriessingular_Assistance1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Assistance`)
};

const ar_wallet_categoriessingular_assistance1 = /** @type {(inputs: Wallet_Categoriessingular_Assistance1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مساعدة`)
};

/**
* | output |
* | --- |
* | "Assistance" |
*
* @param {Wallet_Categoriessingular_Assistance1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_categoriessingular_assistance1 = /** @type {((inputs?: Wallet_Categoriessingular_Assistance1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Categoriessingular_Assistance1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_categoriessingular_assistance1(inputs)
	if (locale === "es") return es_wallet_categoriessingular_assistance1(inputs)
	if (locale === "fr") return fr_wallet_categoriessingular_assistance1(inputs)
	return ar_wallet_categoriessingular_assistance1(inputs)
});
export { wallet_categoriessingular_assistance1 as "wallet.categoriesSingular.assistance" }