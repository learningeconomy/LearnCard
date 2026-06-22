/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Permissions_Edittemplatedescription2Inputs */

const en_boost_cms_permissions_edittemplatedescription2 = /** @type {(inputs: Boost_Cms_Permissions_Edittemplatedescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Anyone can edit this credential template.`)
};

const es_boost_cms_permissions_edittemplatedescription2 = /** @type {(inputs: Boost_Cms_Permissions_Edittemplatedescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cualquiera puede editar esta plantilla de credencial.`)
};

const fr_boost_cms_permissions_edittemplatedescription2 = /** @type {(inputs: Boost_Cms_Permissions_Edittemplatedescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tout le monde peut modifier ce modèle de crédential.`)
};

const ar_boost_cms_permissions_edittemplatedescription2 = /** @type {(inputs: Boost_Cms_Permissions_Edittemplatedescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يمكن لأي شخص تعديل قالب الاعتماد هذا.`)
};

/**
* | output |
* | --- |
* | "Anyone can edit this credential template." |
*
* @param {Boost_Cms_Permissions_Edittemplatedescription2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_permissions_edittemplatedescription2 = /** @type {((inputs?: Boost_Cms_Permissions_Edittemplatedescription2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Permissions_Edittemplatedescription2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_permissions_edittemplatedescription2(inputs)
	if (locale === "es") return es_boost_cms_permissions_edittemplatedescription2(inputs)
	if (locale === "fr") return fr_boost_cms_permissions_edittemplatedescription2(inputs)
	return ar_boost_cms_permissions_edittemplatedescription2(inputs)
});
export { boost_cms_permissions_edittemplatedescription2 as "boost.cms.permissions.editTemplateDescription" }