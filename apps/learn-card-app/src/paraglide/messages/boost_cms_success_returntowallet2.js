/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Success_Returntowallet2Inputs */

const en_boost_cms_success_returntowallet2 = /** @type {(inputs: Boost_Cms_Success_Returntowallet2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Return To Wallet`)
};

const es_boost_cms_success_returntowallet2 = /** @type {(inputs: Boost_Cms_Success_Returntowallet2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Volver a la cartera`)
};

const fr_boost_cms_success_returntowallet2 = /** @type {(inputs: Boost_Cms_Success_Returntowallet2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Retour au portefeuille`)
};

const ar_boost_cms_success_returntowallet2 = /** @type {(inputs: Boost_Cms_Success_Returntowallet2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`العودة إلى المحفظة`)
};

/**
* | output |
* | --- |
* | "Return To Wallet" |
*
* @param {Boost_Cms_Success_Returntowallet2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_success_returntowallet2 = /** @type {((inputs?: Boost_Cms_Success_Returntowallet2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Success_Returntowallet2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_success_returntowallet2(inputs)
	if (locale === "es") return es_boost_cms_success_returntowallet2(inputs)
	if (locale === "fr") return fr_boost_cms_success_returntowallet2(inputs)
	return ar_boost_cms_success_returntowallet2(inputs)
});
export { boost_cms_success_returntowallet2 as "boost.cms.success.returnToWallet" }