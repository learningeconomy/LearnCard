/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_Subheaders_Family_LinkInputs */

const en_wallet_subheaders_family_link = /** @type {(inputs: Wallet_Subheaders_Family_LinkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`family’s learning progress`)
};

const es_wallet_subheaders_family_link = /** @type {(inputs: Wallet_Subheaders_Family_LinkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`progreso de aprendizaje de tu familia`)
};

const fr_wallet_subheaders_family_link = /** @type {(inputs: Wallet_Subheaders_Family_LinkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`progrès d’apprentissage de votre famille`)
};

const ar_wallet_subheaders_family_link = /** @type {(inputs: Wallet_Subheaders_Family_LinkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تقدّم تعلّم عائلتك`)
};

/**
* | output |
* | --- |
* | "family’s learning progress" |
*
* @param {Wallet_Subheaders_Family_LinkInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_subheaders_family_link = /** @type {((inputs?: Wallet_Subheaders_Family_LinkInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Subheaders_Family_LinkInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_subheaders_family_link(inputs)
	if (locale === "es") return es_wallet_subheaders_family_link(inputs)
	if (locale === "fr") return fr_wallet_subheaders_family_link(inputs)
	return ar_wallet_subheaders_family_link(inputs)
});
export { wallet_subheaders_family_link as "wallet.subheaders.family.link" }