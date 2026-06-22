/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Privacy_Showtopublic2Inputs */

const en_boost_cms_privacy_showtopublic2 = /** @type {(inputs: Boost_Cms_Privacy_Showtopublic2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Show to public`)
};

const es_boost_cms_privacy_showtopublic2 = /** @type {(inputs: Boost_Cms_Privacy_Showtopublic2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mostrar al público`)
};

const fr_boost_cms_privacy_showtopublic2 = /** @type {(inputs: Boost_Cms_Privacy_Showtopublic2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Afficher au public`)
};

const ar_boost_cms_privacy_showtopublic2 = /** @type {(inputs: Boost_Cms_Privacy_Showtopublic2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عرض للعامة`)
};

/**
* | output |
* | --- |
* | "Show to public" |
*
* @param {Boost_Cms_Privacy_Showtopublic2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_privacy_showtopublic2 = /** @type {((inputs?: Boost_Cms_Privacy_Showtopublic2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Privacy_Showtopublic2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_privacy_showtopublic2(inputs)
	if (locale === "es") return es_boost_cms_privacy_showtopublic2(inputs)
	if (locale === "fr") return fr_boost_cms_privacy_showtopublic2(inputs)
	return ar_boost_cms_privacy_showtopublic2(inputs)
});
export { boost_cms_privacy_showtopublic2 as "boost.cms.privacy.showToPublic" }