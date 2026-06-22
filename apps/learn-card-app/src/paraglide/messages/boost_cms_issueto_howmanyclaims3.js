/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Issueto_Howmanyclaims3Inputs */

const en_boost_cms_issueto_howmanyclaims3 = /** @type {(inputs: Boost_Cms_Issueto_Howmanyclaims3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`How many claims?`)
};

const es_boost_cms_issueto_howmanyclaims3 = /** @type {(inputs: Boost_Cms_Issueto_Howmanyclaims3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Cuántas reclamaciones?`)
};

const fr_boost_cms_issueto_howmanyclaims3 = /** @type {(inputs: Boost_Cms_Issueto_Howmanyclaims3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Combien de réclamations ?`)
};

const ar_boost_cms_issueto_howmanyclaims3 = /** @type {(inputs: Boost_Cms_Issueto_Howmanyclaims3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`كم عدد المطالبات؟`)
};

/**
* | output |
* | --- |
* | "How many claims?" |
*
* @param {Boost_Cms_Issueto_Howmanyclaims3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_issueto_howmanyclaims3 = /** @type {((inputs?: Boost_Cms_Issueto_Howmanyclaims3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Issueto_Howmanyclaims3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_issueto_howmanyclaims3(inputs)
	if (locale === "es") return es_boost_cms_issueto_howmanyclaims3(inputs)
	if (locale === "fr") return fr_boost_cms_issueto_howmanyclaims3(inputs)
	return ar_boost_cms_issueto_howmanyclaims3(inputs)
});
export { boost_cms_issueto_howmanyclaims3 as "boost.cms.issueTo.howManyClaims" }