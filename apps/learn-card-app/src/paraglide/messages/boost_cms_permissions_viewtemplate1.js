/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Permissions_Viewtemplate1Inputs */

const en_boost_cms_permissions_viewtemplate1 = /** @type {(inputs: Boost_Cms_Permissions_Viewtemplate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`View Template`)
};

const es_boost_cms_permissions_viewtemplate1 = /** @type {(inputs: Boost_Cms_Permissions_Viewtemplate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ver plantilla`)
};

const fr_boost_cms_permissions_viewtemplate1 = /** @type {(inputs: Boost_Cms_Permissions_Viewtemplate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Voir le modèle`)
};

const ar_boost_cms_permissions_viewtemplate1 = /** @type {(inputs: Boost_Cms_Permissions_Viewtemplate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عرض القالب`)
};

/**
* | output |
* | --- |
* | "View Template" |
*
* @param {Boost_Cms_Permissions_Viewtemplate1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_permissions_viewtemplate1 = /** @type {((inputs?: Boost_Cms_Permissions_Viewtemplate1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Permissions_Viewtemplate1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_permissions_viewtemplate1(inputs)
	if (locale === "es") return es_boost_cms_permissions_viewtemplate1(inputs)
	if (locale === "fr") return fr_boost_cms_permissions_viewtemplate1(inputs)
	return ar_boost_cms_permissions_viewtemplate1(inputs)
});
export { boost_cms_permissions_viewtemplate1 as "boost.cms.permissions.viewTemplate" }