/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Publish_Saveasdraft2Inputs */

const en_boost_cms_publish_saveasdraft2 = /** @type {(inputs: Boost_Cms_Publish_Saveasdraft2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Save As Draft`)
};

const es_boost_cms_publish_saveasdraft2 = /** @type {(inputs: Boost_Cms_Publish_Saveasdraft2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guardar como borrador`)
};

const fr_boost_cms_publish_saveasdraft2 = /** @type {(inputs: Boost_Cms_Publish_Saveasdraft2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enregistrer comme brouillon`)
};

const ar_boost_cms_publish_saveasdraft2 = /** @type {(inputs: Boost_Cms_Publish_Saveasdraft2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حفظ كمسودة`)
};

/**
* | output |
* | --- |
* | "Save As Draft" |
*
* @param {Boost_Cms_Publish_Saveasdraft2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_publish_saveasdraft2 = /** @type {((inputs?: Boost_Cms_Publish_Saveasdraft2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Publish_Saveasdraft2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_publish_saveasdraft2(inputs)
	if (locale === "es") return es_boost_cms_publish_saveasdraft2(inputs)
	if (locale === "fr") return fr_boost_cms_publish_saveasdraft2(inputs)
	return ar_boost_cms_publish_saveasdraft2(inputs)
});
export { boost_cms_publish_saveasdraft2 as "boost.cms.publish.saveAsDraft" }