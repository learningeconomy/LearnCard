/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Issueto_Addcontact2Inputs */

const en_boost_cms_issueto_addcontact2 = /** @type {(inputs: Boost_Cms_Issueto_Addcontact2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add contact`)
};

const es_boost_cms_issueto_addcontact2 = /** @type {(inputs: Boost_Cms_Issueto_Addcontact2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Agregar contacto`)
};

const fr_boost_cms_issueto_addcontact2 = /** @type {(inputs: Boost_Cms_Issueto_Addcontact2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter un contact`)
};

const ar_boost_cms_issueto_addcontact2 = /** @type {(inputs: Boost_Cms_Issueto_Addcontact2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إضافة جهة اتصال`)
};

/**
* | output |
* | --- |
* | "Add contact" |
*
* @param {Boost_Cms_Issueto_Addcontact2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_issueto_addcontact2 = /** @type {((inputs?: Boost_Cms_Issueto_Addcontact2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Issueto_Addcontact2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_issueto_addcontact2(inputs)
	if (locale === "es") return es_boost_cms_issueto_addcontact2(inputs)
	if (locale === "fr") return fr_boost_cms_issueto_addcontact2(inputs)
	return ar_boost_cms_issueto_addcontact2(inputs)
});
export { boost_cms_issueto_addcontact2 as "boost.cms.issueTo.addContact" }