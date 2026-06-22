/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Issueto_Enableviewing2Inputs */

const en_boost_cms_issueto_enableviewing2 = /** @type {(inputs: Boost_Cms_Issueto_Enableviewing2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enable viewing to continue with claim link generation.`)
};

const es_boost_cms_issueto_enableviewing2 = /** @type {(inputs: Boost_Cms_Issueto_Enableviewing2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Habilita la visualización para continuar con la generación del enlace de reclamación.`)
};

const fr_boost_cms_issueto_enableviewing2 = /** @type {(inputs: Boost_Cms_Issueto_Enableviewing2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Activez l'affichage pour continuer la génération de liens.`)
};

const ar_boost_cms_issueto_enableviewing2 = /** @type {(inputs: Boost_Cms_Issueto_Enableviewing2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قم بتمكين العرض للمتابعة مع إنشاء رابط المطالبة.`)
};

/**
* | output |
* | --- |
* | "Enable viewing to continue with claim link generation." |
*
* @param {Boost_Cms_Issueto_Enableviewing2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_issueto_enableviewing2 = /** @type {((inputs?: Boost_Cms_Issueto_Enableviewing2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Issueto_Enableviewing2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_issueto_enableviewing2(inputs)
	if (locale === "es") return es_boost_cms_issueto_enableviewing2(inputs)
	if (locale === "fr") return fr_boost_cms_issueto_enableviewing2(inputs)
	return ar_boost_cms_issueto_enableviewing2(inputs)
});
export { boost_cms_issueto_enableviewing2 as "boost.cms.issueTo.enableViewing" }