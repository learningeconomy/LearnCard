/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Chat_Addchat1Inputs */

const en_boost_cms_chat_addchat1 = /** @type {(inputs: Boost_Cms_Chat_Addchat1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add Chat`)
};

const es_boost_cms_chat_addchat1 = /** @type {(inputs: Boost_Cms_Chat_Addchat1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Agregar chat`)
};

const fr_boost_cms_chat_addchat1 = /** @type {(inputs: Boost_Cms_Chat_Addchat1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter un chat`)
};

const ar_boost_cms_chat_addchat1 = /** @type {(inputs: Boost_Cms_Chat_Addchat1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إضافة محادثة`)
};

/**
* | output |
* | --- |
* | "Add Chat" |
*
* @param {Boost_Cms_Chat_Addchat1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_chat_addchat1 = /** @type {((inputs?: Boost_Cms_Chat_Addchat1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Chat_Addchat1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_chat_addchat1(inputs)
	if (locale === "es") return es_boost_cms_chat_addchat1(inputs)
	if (locale === "fr") return fr_boost_cms_chat_addchat1(inputs)
	return ar_boost_cms_chat_addchat1(inputs)
});
export { boost_cms_chat_addchat1 as "boost.cms.chat.addChat" }