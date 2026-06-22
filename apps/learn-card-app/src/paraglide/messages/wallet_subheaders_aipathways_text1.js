/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_Subheaders_Aipathways_Text1Inputs */

const en_wallet_subheaders_aipathways_text1 = /** @type {(inputs: Wallet_Subheaders_Aipathways_Text1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Grow your skills & find new roles`)
};

const es_wallet_subheaders_aipathways_text1 = /** @type {(inputs: Wallet_Subheaders_Aipathways_Text1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Desarrolla tus habilidades y encuentra nuevos roles`)
};

const fr_wallet_subheaders_aipathways_text1 = /** @type {(inputs: Wallet_Subheaders_Aipathways_Text1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Développez vos compétences et trouvez de nouveaux rôles`)
};

const ar_wallet_subheaders_aipathways_text1 = /** @type {(inputs: Wallet_Subheaders_Aipathways_Text1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`طوّر مهاراتك واكتشف أدوارًا جديدة`)
};

/**
* | output |
* | --- |
* | "Grow your skills & find new roles" |
*
* @param {Wallet_Subheaders_Aipathways_Text1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_subheaders_aipathways_text1 = /** @type {((inputs?: Wallet_Subheaders_Aipathways_Text1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Subheaders_Aipathways_Text1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_subheaders_aipathways_text1(inputs)
	if (locale === "es") return es_wallet_subheaders_aipathways_text1(inputs)
	if (locale === "fr") return fr_wallet_subheaders_aipathways_text1(inputs)
	return ar_wallet_subheaders_aipathways_text1(inputs)
});
export { wallet_subheaders_aipathways_text1 as "wallet.subheaders.aiPathways.text" }