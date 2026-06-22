/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Admins_TitleInputs */

const en_boost_cms_admins_title = /** @type {(inputs: Boost_Cms_Admins_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Assign Admins`)
};

const es_boost_cms_admins_title = /** @type {(inputs: Boost_Cms_Admins_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Asignar administradores`)
};

const fr_boost_cms_admins_title = /** @type {(inputs: Boost_Cms_Admins_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Attribuer des administrateurs`)
};

const ar_boost_cms_admins_title = /** @type {(inputs: Boost_Cms_Admins_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعيين مسؤولين`)
};

/**
* | output |
* | --- |
* | "Assign Admins" |
*
* @param {Boost_Cms_Admins_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_admins_title = /** @type {((inputs?: Boost_Cms_Admins_TitleInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Admins_TitleInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_admins_title(inputs)
	if (locale === "es") return es_boost_cms_admins_title(inputs)
	if (locale === "fr") return fr_boost_cms_admins_title(inputs)
	return ar_boost_cms_admins_title(inputs)
});
export { boost_cms_admins_title as "boost.cms.admins.title" }