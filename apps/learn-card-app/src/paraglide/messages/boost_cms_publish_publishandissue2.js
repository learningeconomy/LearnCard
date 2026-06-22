/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Publish_Publishandissue2Inputs */

const en_boost_cms_publish_publishandissue2 = /** @type {(inputs: Boost_Cms_Publish_Publishandissue2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Publish & Issue`)
};

const es_boost_cms_publish_publishandissue2 = /** @type {(inputs: Boost_Cms_Publish_Publishandissue2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Publicar y emitir`)
};

const fr_boost_cms_publish_publishandissue2 = /** @type {(inputs: Boost_Cms_Publish_Publishandissue2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Publier et émettre`)
};

const ar_boost_cms_publish_publishandissue2 = /** @type {(inputs: Boost_Cms_Publish_Publishandissue2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نشر وإصدار`)
};

/**
* | output |
* | --- |
* | "Publish & Issue" |
*
* @param {Boost_Cms_Publish_Publishandissue2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_publish_publishandissue2 = /** @type {((inputs?: Boost_Cms_Publish_Publishandissue2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Publish_Publishandissue2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_publish_publishandissue2(inputs)
	if (locale === "es") return es_boost_cms_publish_publishandissue2(inputs)
	if (locale === "fr") return fr_boost_cms_publish_publishandissue2(inputs)
	return ar_boost_cms_publish_publishandissue2(inputs)
});
export { boost_cms_publish_publishandissue2 as "boost.cms.publish.publishAndIssue" }