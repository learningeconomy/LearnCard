/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Shortboost_Selectrecipients2Inputs */

const en_boost_shortboost_selectrecipients2 = /** @type {(inputs: Boost_Shortboost_Selectrecipients2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select Recipients`)
};

const es_boost_shortboost_selectrecipients2 = /** @type {(inputs: Boost_Shortboost_Selectrecipients2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Seleccionar destinatarios`)
};

const fr_boost_shortboost_selectrecipients2 = /** @type {(inputs: Boost_Shortboost_Selectrecipients2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionner les destinataires`)
};

const ar_boost_shortboost_selectrecipients2 = /** @type {(inputs: Boost_Shortboost_Selectrecipients2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختيار المستلمين`)
};

/**
* | output |
* | --- |
* | "Select Recipients" |
*
* @param {Boost_Shortboost_Selectrecipients2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_shortboost_selectrecipients2 = /** @type {((inputs?: Boost_Shortboost_Selectrecipients2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Shortboost_Selectrecipients2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_shortboost_selectrecipients2(inputs)
	if (locale === "es") return es_boost_shortboost_selectrecipients2(inputs)
	if (locale === "fr") return fr_boost_shortboost_selectrecipients2(inputs)
	return ar_boost_shortboost_selectrecipients2(inputs)
});
export { boost_shortboost_selectrecipients2 as "boost.shortBoost.selectRecipients" }