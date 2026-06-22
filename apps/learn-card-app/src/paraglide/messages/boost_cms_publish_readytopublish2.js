/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Publish_Readytopublish2Inputs */

const en_boost_cms_publish_readytopublish2 = /** @type {(inputs: Boost_Cms_Publish_Readytopublish2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Are you ready to publish?`)
};

const es_boost_cms_publish_readytopublish2 = /** @type {(inputs: Boost_Cms_Publish_Readytopublish2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Estás listo para publicar?`)
};

const fr_boost_cms_publish_readytopublish2 = /** @type {(inputs: Boost_Cms_Publish_Readytopublish2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Êtes-vous prêt à publier ?`)
};

const ar_boost_cms_publish_readytopublish2 = /** @type {(inputs: Boost_Cms_Publish_Readytopublish2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هل أنت مستعد للنشر؟`)
};

/**
* | output |
* | --- |
* | "Are you ready to publish?" |
*
* @param {Boost_Cms_Publish_Readytopublish2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_publish_readytopublish2 = /** @type {((inputs?: Boost_Cms_Publish_Readytopublish2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Publish_Readytopublish2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_publish_readytopublish2(inputs)
	if (locale === "es") return es_boost_cms_publish_readytopublish2(inputs)
	if (locale === "fr") return fr_boost_cms_publish_readytopublish2(inputs)
	return ar_boost_cms_publish_readytopublish2(inputs)
});
export { boost_cms_publish_readytopublish2 as "boost.cms.publish.readyToPublish" }