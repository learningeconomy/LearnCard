/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Media_Mediadisplaytoggledescription3Inputs */

const en_boost_cms_media_mediadisplaytoggledescription3 = /** @type {(inputs: Boost_Cms_Media_Mediadisplaytoggledescription3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`When on, this credential will show the attached media instead of the default layout.`)
};

const es_boost_cms_media_mediadisplaytoggledescription3 = /** @type {(inputs: Boost_Cms_Media_Mediadisplaytoggledescription3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cuando está activado, esta credencial mostrará los medios adjuntos en lugar del diseño predeterminado.`)
};

const fr_boost_cms_media_mediadisplaytoggledescription3 = /** @type {(inputs: Boost_Cms_Media_Mediadisplaytoggledescription3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Si activé, cette crédential affichera les médias joints au lieu de la mise en page par défaut.`)
};

const ar_boost_cms_media_mediadisplaytoggledescription3 = /** @type {(inputs: Boost_Cms_Media_Mediadisplaytoggledescription3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عند التشغيل، سيعرض هذا الاعتماد الوسائط المرفقة بدلاً من التخطيط الافتراضي.`)
};

/**
* | output |
* | --- |
* | "When on, this credential will show the attached media instead of the default layout." |
*
* @param {Boost_Cms_Media_Mediadisplaytoggledescription3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_media_mediadisplaytoggledescription3 = /** @type {((inputs?: Boost_Cms_Media_Mediadisplaytoggledescription3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Media_Mediadisplaytoggledescription3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_media_mediadisplaytoggledescription3(inputs)
	if (locale === "es") return es_boost_cms_media_mediadisplaytoggledescription3(inputs)
	if (locale === "fr") return fr_boost_cms_media_mediadisplaytoggledescription3(inputs)
	return ar_boost_cms_media_mediadisplaytoggledescription3(inputs)
});
export { boost_cms_media_mediadisplaytoggledescription3 as "boost.cms.media.mediaDisplayToggleDescription" }