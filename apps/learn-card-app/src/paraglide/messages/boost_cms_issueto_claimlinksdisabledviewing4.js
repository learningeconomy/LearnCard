/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Issueto_Claimlinksdisabledviewing4Inputs */

const en_boost_cms_issueto_claimlinksdisabledviewing4 = /** @type {(inputs: Boost_Cms_Issueto_Claimlinksdisabledviewing4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Claim links are disabled because viewing is not enabled for this template.`)
};

const es_boost_cms_issueto_claimlinksdisabledviewing4 = /** @type {(inputs: Boost_Cms_Issueto_Claimlinksdisabledviewing4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Los enlaces de reclamación están deshabilitados porque la visualización no está habilitada para esta plantilla.`)
};

const fr_boost_cms_issueto_claimlinksdisabledviewing4 = /** @type {(inputs: Boost_Cms_Issueto_Claimlinksdisabledviewing4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Les liens de réclamation sont désactivés car l'affichage n'est pas activé pour ce modèle.`)
};

const ar_boost_cms_issueto_claimlinksdisabledviewing4 = /** @type {(inputs: Boost_Cms_Issueto_Claimlinksdisabledviewing4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`روابط المطالبة معطلة لأن العرض غير مفعل لهذا القالب.`)
};

/**
* | output |
* | --- |
* | "Claim links are disabled because viewing is not enabled for this template." |
*
* @param {Boost_Cms_Issueto_Claimlinksdisabledviewing4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_issueto_claimlinksdisabledviewing4 = /** @type {((inputs?: Boost_Cms_Issueto_Claimlinksdisabledviewing4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Issueto_Claimlinksdisabledviewing4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_issueto_claimlinksdisabledviewing4(inputs)
	if (locale === "es") return es_boost_cms_issueto_claimlinksdisabledviewing4(inputs)
	if (locale === "fr") return fr_boost_cms_issueto_claimlinksdisabledviewing4(inputs)
	return ar_boost_cms_issueto_claimlinksdisabledviewing4(inputs)
});
export { boost_cms_issueto_claimlinksdisabledviewing4 as "boost.cms.issueTo.claimLinksDisabledViewing" }