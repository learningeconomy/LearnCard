/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Shortboost_Selectrecipient2Inputs */

const en_boost_shortboost_selectrecipient2 = /** @type {(inputs: Boost_Shortboost_Selectrecipient2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select Recipient`)
};

const es_boost_shortboost_selectrecipient2 = /** @type {(inputs: Boost_Shortboost_Selectrecipient2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Seleccionar destinatario`)
};

const fr_boost_shortboost_selectrecipient2 = /** @type {(inputs: Boost_Shortboost_Selectrecipient2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionner le destinataire`)
};

const ar_boost_shortboost_selectrecipient2 = /** @type {(inputs: Boost_Shortboost_Selectrecipient2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختيار المستلم`)
};

/**
* | output |
* | --- |
* | "Select Recipient" |
*
* @param {Boost_Shortboost_Selectrecipient2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_shortboost_selectrecipient2 = /** @type {((inputs?: Boost_Shortboost_Selectrecipient2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Shortboost_Selectrecipient2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_shortboost_selectrecipient2(inputs)
	if (locale === "es") return es_boost_shortboost_selectrecipient2(inputs)
	if (locale === "fr") return fr_boost_shortboost_selectrecipient2(inputs)
	return ar_boost_shortboost_selectrecipient2(inputs)
});
export { boost_shortboost_selectrecipient2 as "boost.shortBoost.selectRecipient" }