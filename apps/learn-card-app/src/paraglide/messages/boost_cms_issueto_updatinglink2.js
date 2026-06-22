/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Issueto_Updatinglink2Inputs */

const en_boost_cms_issueto_updatinglink2 = /** @type {(inputs: Boost_Cms_Issueto_Updatinglink2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Updating Link...`)
};

const es_boost_cms_issueto_updatinglink2 = /** @type {(inputs: Boost_Cms_Issueto_Updatinglink2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Actualizando enlace...`)
};

const fr_boost_cms_issueto_updatinglink2 = /** @type {(inputs: Boost_Cms_Issueto_Updatinglink2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mise à jour du lien...`)
};

const ar_boost_cms_issueto_updatinglink2 = /** @type {(inputs: Boost_Cms_Issueto_Updatinglink2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري تحديث الرابط...`)
};

/**
* | output |
* | --- |
* | "Updating Link..." |
*
* @param {Boost_Cms_Issueto_Updatinglink2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_issueto_updatinglink2 = /** @type {((inputs?: Boost_Cms_Issueto_Updatinglink2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Issueto_Updatinglink2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_issueto_updatinglink2(inputs)
	if (locale === "es") return es_boost_cms_issueto_updatinglink2(inputs)
	if (locale === "fr") return fr_boost_cms_issueto_updatinglink2(inputs)
	return ar_boost_cms_issueto_updatinglink2(inputs)
});
export { boost_cms_issueto_updatinglink2 as "boost.cms.issueTo.updatingLink" }