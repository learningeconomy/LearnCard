/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Publish_Lockwarning1Inputs */

const en_boost_cms_publish_lockwarning1 = /** @type {(inputs: Boost_Cms_Publish_Lockwarning1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This boost will be locked in a verifiable seal forever and can't be changed after you publish.`)
};

const es_boost_cms_publish_lockwarning1 = /** @type {(inputs: Boost_Cms_Publish_Lockwarning1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Este boost se bloqueará en un sello verificable para siempre y no se puede cambiar después de publicarlo.`)
};

const fr_boost_cms_publish_lockwarning1 = /** @type {(inputs: Boost_Cms_Publish_Lockwarning1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ce boost sera scellé de manière vérifiable pour toujours et ne pourra pas être modifié après publication.`)
};

const ar_boost_cms_publish_lockwarning1 = /** @type {(inputs: Boost_Cms_Publish_Lockwarning1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سيتم قفل هذا البوست في ختم قابل للتحقق إلى الأبد ولا يمكن تغييره بعد النشر.`)
};

/**
* | output |
* | --- |
* | "This boost will be locked in a verifiable seal forever and can't be changed after you publish." |
*
* @param {Boost_Cms_Publish_Lockwarning1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_publish_lockwarning1 = /** @type {((inputs?: Boost_Cms_Publish_Lockwarning1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Publish_Lockwarning1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_publish_lockwarning1(inputs)
	if (locale === "es") return es_boost_cms_publish_lockwarning1(inputs)
	if (locale === "fr") return fr_boost_cms_publish_lockwarning1(inputs)
	return ar_boost_cms_publish_lockwarning1(inputs)
});
export { boost_cms_publish_lockwarning1 as "boost.cms.publish.lockWarning" }