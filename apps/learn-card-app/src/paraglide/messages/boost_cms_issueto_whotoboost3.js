/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Issueto_Whotoboost3Inputs */

const en_boost_cms_issueto_whotoboost3 = /** @type {(inputs: Boost_Cms_Issueto_Whotoboost3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Who do you want to boost?`)
};

const es_boost_cms_issueto_whotoboost3 = /** @type {(inputs: Boost_Cms_Issueto_Whotoboost3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿A quién quieres emitir un Boost?`)
};

const fr_boost_cms_issueto_whotoboost3 = /** @type {(inputs: Boost_Cms_Issueto_Whotoboost3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`À qui voulez-vous délivrer un Boost ?`)
};

const ar_boost_cms_issueto_whotoboost3 = /** @type {(inputs: Boost_Cms_Issueto_Whotoboost3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لمن تريد إصدار Boost؟`)
};

/**
* | output |
* | --- |
* | "Who do you want to boost?" |
*
* @param {Boost_Cms_Issueto_Whotoboost3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_issueto_whotoboost3 = /** @type {((inputs?: Boost_Cms_Issueto_Whotoboost3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Issueto_Whotoboost3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_issueto_whotoboost3(inputs)
	if (locale === "es") return es_boost_cms_issueto_whotoboost3(inputs)
	if (locale === "fr") return fr_boost_cms_issueto_whotoboost3(inputs)
	return ar_boost_cms_issueto_whotoboost3(inputs)
});
export { boost_cms_issueto_whotoboost3 as "boost.cms.issueTo.whoToBoost" }