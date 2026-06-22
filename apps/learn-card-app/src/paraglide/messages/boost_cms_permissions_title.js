/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Permissions_TitleInputs */

const en_boost_cms_permissions_title = /** @type {(inputs: Boost_Cms_Permissions_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Default Permissions`)
};

const es_boost_cms_permissions_title = /** @type {(inputs: Boost_Cms_Permissions_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Permisos predeterminados`)
};

const fr_boost_cms_permissions_title = /** @type {(inputs: Boost_Cms_Permissions_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Permissions par défaut`)
};

const ar_boost_cms_permissions_title = /** @type {(inputs: Boost_Cms_Permissions_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الأذونات الافتراضية`)
};

/**
* | output |
* | --- |
* | "Default Permissions" |
*
* @param {Boost_Cms_Permissions_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_permissions_title = /** @type {((inputs?: Boost_Cms_Permissions_TitleInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Permissions_TitleInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_permissions_title(inputs)
	if (locale === "es") return es_boost_cms_permissions_title(inputs)
	if (locale === "fr") return fr_boost_cms_permissions_title(inputs)
	return ar_boost_cms_permissions_title(inputs)
});
export { boost_cms_permissions_title as "boost.cms.permissions.title" }