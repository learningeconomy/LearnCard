/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Issueto_Adminsdescription2Inputs */

const en_boost_cms_issueto_adminsdescription2 = /** @type {(inputs: Boost_Cms_Issueto_Adminsdescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Admins are granted permission to send and edit this Boost.`)
};

const es_boost_cms_issueto_adminsdescription2 = /** @type {(inputs: Boost_Cms_Issueto_Adminsdescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Los administradores reciben permiso para enviar y editar este Boost.`)
};

const fr_boost_cms_issueto_adminsdescription2 = /** @type {(inputs: Boost_Cms_Issueto_Adminsdescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Les administrateurs reçoivent l'autorisation d'envoyer et de modifier ce Boost.`)
};

const ar_boost_cms_issueto_adminsdescription2 = /** @type {(inputs: Boost_Cms_Issueto_Adminsdescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يُمنح المسؤولون إذن إرسال هذا الـ Boost وتحريره.`)
};

/**
* | output |
* | --- |
* | "Admins are granted permission to send and edit this Boost." |
*
* @param {Boost_Cms_Issueto_Adminsdescription2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_issueto_adminsdescription2 = /** @type {((inputs?: Boost_Cms_Issueto_Adminsdescription2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Issueto_Adminsdescription2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_issueto_adminsdescription2(inputs)
	if (locale === "es") return es_boost_cms_issueto_adminsdescription2(inputs)
	if (locale === "fr") return fr_boost_cms_issueto_adminsdescription2(inputs)
	return ar_boost_cms_issueto_adminsdescription2(inputs)
});
export { boost_cms_issueto_adminsdescription2 as "boost.cms.issueTo.adminsDescription" }