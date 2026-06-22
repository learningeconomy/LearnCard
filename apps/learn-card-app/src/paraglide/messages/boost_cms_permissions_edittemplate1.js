/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Permissions_Edittemplate1Inputs */

const en_boost_cms_permissions_edittemplate1 = /** @type {(inputs: Boost_Cms_Permissions_Edittemplate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Edit Template`)
};

const es_boost_cms_permissions_edittemplate1 = /** @type {(inputs: Boost_Cms_Permissions_Edittemplate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Editar plantilla`)
};

const fr_boost_cms_permissions_edittemplate1 = /** @type {(inputs: Boost_Cms_Permissions_Edittemplate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modifier le modèle`)
};

const ar_boost_cms_permissions_edittemplate1 = /** @type {(inputs: Boost_Cms_Permissions_Edittemplate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعديل القالب`)
};

/**
* | output |
* | --- |
* | "Edit Template" |
*
* @param {Boost_Cms_Permissions_Edittemplate1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_permissions_edittemplate1 = /** @type {((inputs?: Boost_Cms_Permissions_Edittemplate1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Permissions_Edittemplate1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_permissions_edittemplate1(inputs)
	if (locale === "es") return es_boost_cms_permissions_edittemplate1(inputs)
	if (locale === "fr") return fr_boost_cms_permissions_edittemplate1(inputs)
	return ar_boost_cms_permissions_edittemplate1(inputs)
});
export { boost_cms_permissions_edittemplate1 as "boost.cms.permissions.editTemplate" }