/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Permissions_Sendtemplatedescription2Inputs */

const en_boost_cms_permissions_sendtemplatedescription2 = /** @type {(inputs: Boost_Cms_Permissions_Sendtemplatedescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Anyone can send this credential template.`)
};

const es_boost_cms_permissions_sendtemplatedescription2 = /** @type {(inputs: Boost_Cms_Permissions_Sendtemplatedescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cualquiera puede enviar esta plantilla de credencial.`)
};

const fr_boost_cms_permissions_sendtemplatedescription2 = /** @type {(inputs: Boost_Cms_Permissions_Sendtemplatedescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tout le monde peut envoyer ce modèle de crédential.`)
};

const ar_boost_cms_permissions_sendtemplatedescription2 = /** @type {(inputs: Boost_Cms_Permissions_Sendtemplatedescription2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يمكن لأي شخص إرسال قالب الاعتماد هذا.`)
};

/**
* | output |
* | --- |
* | "Anyone can send this credential template." |
*
* @param {Boost_Cms_Permissions_Sendtemplatedescription2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_permissions_sendtemplatedescription2 = /** @type {((inputs?: Boost_Cms_Permissions_Sendtemplatedescription2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Permissions_Sendtemplatedescription2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_permissions_sendtemplatedescription2(inputs)
	if (locale === "es") return es_boost_cms_permissions_sendtemplatedescription2(inputs)
	if (locale === "fr") return fr_boost_cms_permissions_sendtemplatedescription2(inputs)
	return ar_boost_cms_permissions_sendtemplatedescription2(inputs)
});
export { boost_cms_permissions_sendtemplatedescription2 as "boost.cms.permissions.sendTemplateDescription" }