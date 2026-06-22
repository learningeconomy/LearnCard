/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Media_Addmediaattachment2Inputs */

const en_boost_cms_media_addmediaattachment2 = /** @type {(inputs: Boost_Cms_Media_Addmediaattachment2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add media attachment`)
};

const es_boost_cms_media_addmediaattachment2 = /** @type {(inputs: Boost_Cms_Media_Addmediaattachment2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Agregar adjunto de medios`)
};

const fr_boost_cms_media_addmediaattachment2 = /** @type {(inputs: Boost_Cms_Media_Addmediaattachment2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter une pièce jointe`)
};

const ar_boost_cms_media_addmediaattachment2 = /** @type {(inputs: Boost_Cms_Media_Addmediaattachment2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إضافة مرفق وسائط`)
};

/**
* | output |
* | --- |
* | "Add media attachment" |
*
* @param {Boost_Cms_Media_Addmediaattachment2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_media_addmediaattachment2 = /** @type {((inputs?: Boost_Cms_Media_Addmediaattachment2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Media_Addmediaattachment2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_media_addmediaattachment2(inputs)
	if (locale === "es") return es_boost_cms_media_addmediaattachment2(inputs)
	if (locale === "fr") return fr_boost_cms_media_addmediaattachment2(inputs)
	return ar_boost_cms_media_addmediaattachment2(inputs)
});
export { boost_cms_media_addmediaattachment2 as "boost.cms.media.addMediaAttachment" }