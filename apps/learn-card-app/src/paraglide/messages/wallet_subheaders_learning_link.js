/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_Subheaders_Learning_LinkInputs */

const en_wallet_subheaders_learning_link = /** @type {(inputs: Wallet_Subheaders_Learning_LinkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`learning journey`)
};

const es_wallet_subheaders_learning_link = /** @type {(inputs: Wallet_Subheaders_Learning_LinkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`trayectoria de aprendizaje`)
};

const fr_wallet_subheaders_learning_link = /** @type {(inputs: Wallet_Subheaders_Learning_LinkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`parcours d’apprentissage`)
};

const ar_wallet_subheaders_learning_link = /** @type {(inputs: Wallet_Subheaders_Learning_LinkInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رحلتك التعليمية`)
};

/**
* | output |
* | --- |
* | "learning journey" |
*
* @param {Wallet_Subheaders_Learning_LinkInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_subheaders_learning_link = /** @type {((inputs?: Wallet_Subheaders_Learning_LinkInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Subheaders_Learning_LinkInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_subheaders_learning_link(inputs)
	if (locale === "es") return es_wallet_subheaders_learning_link(inputs)
	if (locale === "fr") return fr_wallet_subheaders_learning_link(inputs)
	return ar_wallet_subheaders_learning_link(inputs)
});
export { wallet_subheaders_learning_link as "wallet.subheaders.learning.link" }