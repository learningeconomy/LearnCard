/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Media_Addmediatocontinue3Inputs */

const en_boost_cms_media_addmediatocontinue3 = /** @type {(inputs: Boost_Cms_Media_Addmediatocontinue3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add media to continue.`)
};

const es_boost_cms_media_addmediatocontinue3 = /** @type {(inputs: Boost_Cms_Media_Addmediatocontinue3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Agrega medios para continuar.`)
};

const fr_boost_cms_media_addmediatocontinue3 = /** @type {(inputs: Boost_Cms_Media_Addmediatocontinue3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajoutez des médias pour continuer.`)
};

const ar_boost_cms_media_addmediatocontinue3 = /** @type {(inputs: Boost_Cms_Media_Addmediatocontinue3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أضف وسائط للمتابعة.`)
};

/**
* | output |
* | --- |
* | "Add media to continue." |
*
* @param {Boost_Cms_Media_Addmediatocontinue3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_media_addmediatocontinue3 = /** @type {((inputs?: Boost_Cms_Media_Addmediatocontinue3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Media_Addmediatocontinue3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_media_addmediatocontinue3(inputs)
	if (locale === "es") return es_boost_cms_media_addmediatocontinue3(inputs)
	if (locale === "fr") return fr_boost_cms_media_addmediatocontinue3(inputs)
	return ar_boost_cms_media_addmediatocontinue3(inputs)
});
export { boost_cms_media_addmediatocontinue3 as "boost.cms.media.addMediaToContinue" }