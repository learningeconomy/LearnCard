/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Issueto_Assignadmins2Inputs */

const en_boost_cms_issueto_assignadmins2 = /** @type {(inputs: Boost_Cms_Issueto_Assignadmins2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Assign Admins`)
};

const es_boost_cms_issueto_assignadmins2 = /** @type {(inputs: Boost_Cms_Issueto_Assignadmins2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Asignar administradores`)
};

const fr_boost_cms_issueto_assignadmins2 = /** @type {(inputs: Boost_Cms_Issueto_Assignadmins2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Attribuer des administrateurs`)
};

const ar_boost_cms_issueto_assignadmins2 = /** @type {(inputs: Boost_Cms_Issueto_Assignadmins2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعيين مسؤولين`)
};

/**
* | output |
* | --- |
* | "Assign Admins" |
*
* @param {Boost_Cms_Issueto_Assignadmins2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_issueto_assignadmins2 = /** @type {((inputs?: Boost_Cms_Issueto_Assignadmins2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Issueto_Assignadmins2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_issueto_assignadmins2(inputs)
	if (locale === "es") return es_boost_cms_issueto_assignadmins2(inputs)
	if (locale === "fr") return fr_boost_cms_issueto_assignadmins2(inputs)
	return ar_boost_cms_issueto_assignadmins2(inputs)
});
export { boost_cms_issueto_assignadmins2 as "boost.cms.issueTo.assignAdmins" }