/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Permissions_Sendtemplate1Inputs */

const en_boost_cms_permissions_sendtemplate1 = /** @type {(inputs: Boost_Cms_Permissions_Sendtemplate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Send Template`)
};

const es_boost_cms_permissions_sendtemplate1 = /** @type {(inputs: Boost_Cms_Permissions_Sendtemplate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enviar plantilla`)
};

const fr_boost_cms_permissions_sendtemplate1 = /** @type {(inputs: Boost_Cms_Permissions_Sendtemplate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envoyer le modèle`)
};

const ar_boost_cms_permissions_sendtemplate1 = /** @type {(inputs: Boost_Cms_Permissions_Sendtemplate1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إرسال القالب`)
};

/**
* | output |
* | --- |
* | "Send Template" |
*
* @param {Boost_Cms_Permissions_Sendtemplate1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_permissions_sendtemplate1 = /** @type {((inputs?: Boost_Cms_Permissions_Sendtemplate1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Permissions_Sendtemplate1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_permissions_sendtemplate1(inputs)
	if (locale === "es") return es_boost_cms_permissions_sendtemplate1(inputs)
	if (locale === "fr") return fr_boost_cms_permissions_sendtemplate1(inputs)
	return ar_boost_cms_permissions_sendtemplate1(inputs)
});
export { boost_cms_permissions_sendtemplate1 as "boost.cms.permissions.sendTemplate" }