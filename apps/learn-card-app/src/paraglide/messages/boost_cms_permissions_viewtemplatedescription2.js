/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Permissions_Viewtemplatedescription2Inputs */

const en_boost_cms_permissions_viewtemplatedescription2 = /** @type {(inputs: Boost_Cms_Permissions_Viewtemplatedescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Anyone can view this credential template.`)
};

const es_boost_cms_permissions_viewtemplatedescription2 = /** @type {(inputs: Boost_Cms_Permissions_Viewtemplatedescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cualquiera puede ver esta plantilla de credencial.`)
};

const fr_boost_cms_permissions_viewtemplatedescription2 = /** @type {(inputs: Boost_Cms_Permissions_Viewtemplatedescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tout le monde peut voir ce modèle de crédential.`)
};

const ar_boost_cms_permissions_viewtemplatedescription2 = /** @type {(inputs: Boost_Cms_Permissions_Viewtemplatedescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يمكن لأي شخص عرض قالب الاعتماد هذا.`)
};

/**
* | output |
* | --- |
* | "Anyone can view this credential template." |
*
* @param {Boost_Cms_Permissions_Viewtemplatedescription2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_permissions_viewtemplatedescription2 = /** @type {((inputs?: Boost_Cms_Permissions_Viewtemplatedescription2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Permissions_Viewtemplatedescription2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_permissions_viewtemplatedescription2(inputs)
	if (locale === "es") return es_boost_cms_permissions_viewtemplatedescription2(inputs)
	if (locale === "fr") return fr_boost_cms_permissions_viewtemplatedescription2(inputs)
	return ar_boost_cms_permissions_viewtemplatedescription2(inputs)
});
export { boost_cms_permissions_viewtemplatedescription2 as "boost.cms.permissions.viewTemplateDescription" }