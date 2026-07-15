/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Credsbundle_Shareboosts2Inputs */

const en_credsbundle_shareboosts2 = /** @type {(inputs: Credsbundle_Shareboosts2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Share Boosts`)
};

const es_credsbundle_shareboosts2 = /** @type {(inputs: Credsbundle_Shareboosts2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compartir Boosts`)
};

const fr_credsbundle_shareboosts2 = /** @type {(inputs: Credsbundle_Shareboosts2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Partager les Boosts`)
};

const ar_credsbundle_shareboosts2 = /** @type {(inputs: Credsbundle_Shareboosts2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مشاركة التعزيزات`)
};

/**
* | output |
* | --- |
* | "Share Boosts" |
*
* @param {Credsbundle_Shareboosts2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const credsbundle_shareboosts2 = /** @type {((inputs?: Credsbundle_Shareboosts2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Credsbundle_Shareboosts2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_credsbundle_shareboosts2(inputs)
	if (locale === "es") return es_credsbundle_shareboosts2(inputs)
	if (locale === "fr") return fr_credsbundle_shareboosts2(inputs)
	return ar_credsbundle_shareboosts2(inputs)
});
export { credsbundle_shareboosts2 as "credsBundle.shareBoosts" }