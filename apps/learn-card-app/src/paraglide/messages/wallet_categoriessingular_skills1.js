/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_Categoriessingular_Skills1Inputs */

const en_wallet_categoriessingular_skills1 = /** @type {(inputs: Wallet_Categoriessingular_Skills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Skill`)
};

const es_wallet_categoriessingular_skills1 = /** @type {(inputs: Wallet_Categoriessingular_Skills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Habilidad`)
};

const fr_wallet_categoriessingular_skills1 = /** @type {(inputs: Wallet_Categoriessingular_Skills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compétence`)
};

const ar_wallet_categoriessingular_skills1 = /** @type {(inputs: Wallet_Categoriessingular_Skills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مهارة`)
};

/**
* | output |
* | --- |
* | "Skill" |
*
* @param {Wallet_Categoriessingular_Skills1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_categoriessingular_skills1 = /** @type {((inputs?: Wallet_Categoriessingular_Skills1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Categoriessingular_Skills1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_categoriessingular_skills1(inputs)
	if (locale === "es") return es_wallet_categoriessingular_skills1(inputs)
	if (locale === "fr") return fr_wallet_categoriessingular_skills1(inputs)
	return ar_wallet_categoriessingular_skills1(inputs)
});
export { wallet_categoriessingular_skills1 as "wallet.categoriesSingular.skills" }