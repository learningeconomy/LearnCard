/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Permissions_DescriptionInputs */

const en_boost_cms_permissions_description = /** @type {(inputs: Boost_Cms_Permissions_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configure what anyone can view, edit, or send by default for this credential template.`)
};

const es_boost_cms_permissions_description = /** @type {(inputs: Boost_Cms_Permissions_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configura lo que cualquier persona puede ver, editar o enviar por defecto para esta plantilla de credencial.`)
};

const fr_boost_cms_permissions_description = /** @type {(inputs: Boost_Cms_Permissions_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configurez ce que tout le monde peut afficher, modifier ou envoyer par défaut pour ce modèle de crédential.`)
};

const ar_boost_cms_permissions_description = /** @type {(inputs: Boost_Cms_Permissions_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تكوين ما يمكن لأي شخص عرضه أو تعديله أو إرساله افتراضيًا لقالب الاعتماد هذا.`)
};

/**
* | output |
* | --- |
* | "Configure what anyone can view, edit, or send by default for this credential template." |
*
* @param {Boost_Cms_Permissions_DescriptionInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_permissions_description = /** @type {((inputs?: Boost_Cms_Permissions_DescriptionInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Permissions_DescriptionInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_permissions_description(inputs)
	if (locale === "es") return es_boost_cms_permissions_description(inputs)
	if (locale === "fr") return fr_boost_cms_permissions_description(inputs)
	return ar_boost_cms_permissions_description(inputs)
});
export { boost_cms_permissions_description as "boost.cms.permissions.description" }