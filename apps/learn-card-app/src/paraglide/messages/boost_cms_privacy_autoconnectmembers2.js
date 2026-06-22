/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Privacy_Autoconnectmembers2Inputs */

const en_boost_cms_privacy_autoconnectmembers2 = /** @type {(inputs: Boost_Cms_Privacy_Autoconnectmembers2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Automatically connect members in contacts`)
};

const es_boost_cms_privacy_autoconnectmembers2 = /** @type {(inputs: Boost_Cms_Privacy_Autoconnectmembers2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Conectar automáticamente a los miembros en contactos`)
};

const fr_boost_cms_privacy_autoconnectmembers2 = /** @type {(inputs: Boost_Cms_Privacy_Autoconnectmembers2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connecter automatiquement les membres dans les contacts`)
};

const ar_boost_cms_privacy_autoconnectmembers2 = /** @type {(inputs: Boost_Cms_Privacy_Autoconnectmembers2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`توصيل الأعضاء تلقائيًا في جهات الاتصال`)
};

/**
* | output |
* | --- |
* | "Automatically connect members in contacts" |
*
* @param {Boost_Cms_Privacy_Autoconnectmembers2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_privacy_autoconnectmembers2 = /** @type {((inputs?: Boost_Cms_Privacy_Autoconnectmembers2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Privacy_Autoconnectmembers2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_privacy_autoconnectmembers2(inputs)
	if (locale === "es") return es_boost_cms_privacy_autoconnectmembers2(inputs)
	if (locale === "fr") return fr_boost_cms_privacy_autoconnectmembers2(inputs)
	return ar_boost_cms_privacy_autoconnectmembers2(inputs)
});
export { boost_cms_privacy_autoconnectmembers2 as "boost.cms.privacy.autoConnectMembers" }