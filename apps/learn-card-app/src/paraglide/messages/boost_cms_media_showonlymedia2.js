/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Media_Showonlymedia2Inputs */

const en_boost_cms_media_showonlymedia2 = /** @type {(inputs: Boost_Cms_Media_Showonlymedia2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Show only media for credential display`)
};

const es_boost_cms_media_showonlymedia2 = /** @type {(inputs: Boost_Cms_Media_Showonlymedia2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mostrar solo medios para la visualización de la credencial`)
};

const fr_boost_cms_media_showonlymedia2 = /** @type {(inputs: Boost_Cms_Media_Showonlymedia2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Afficher uniquement les médias pour l'affichage de la crédential`)
};

const ar_boost_cms_media_showonlymedia2 = /** @type {(inputs: Boost_Cms_Media_Showonlymedia2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عرض الوسائط فقط لعرض الاعتماد`)
};

/**
* | output |
* | --- |
* | "Show only media for credential display" |
*
* @param {Boost_Cms_Media_Showonlymedia2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_media_showonlymedia2 = /** @type {((inputs?: Boost_Cms_Media_Showonlymedia2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Media_Showonlymedia2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_media_showonlymedia2(inputs)
	if (locale === "es") return es_boost_cms_media_showonlymedia2(inputs)
	if (locale === "fr") return fr_boost_cms_media_showonlymedia2(inputs)
	return ar_boost_cms_media_showonlymedia2(inputs)
});
export { boost_cms_media_showonlymedia2 as "boost.cms.media.showOnlyMedia" }