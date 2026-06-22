/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Issueto_Cannotgenerateclaimlinks4Inputs */

const en_boost_cms_issueto_cannotgenerateclaimlinks4 = /** @type {(inputs: Boost_Cms_Issueto_Cannotgenerateclaimlinks4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This template cannot generate claim links because view permission are disabled.`)
};

const es_boost_cms_issueto_cannotgenerateclaimlinks4 = /** @type {(inputs: Boost_Cms_Issueto_Cannotgenerateclaimlinks4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Esta plantilla no puede generar enlaces de reclamación porque el permiso de visualización está deshabilitado.`)
};

const fr_boost_cms_issueto_cannotgenerateclaimlinks4 = /** @type {(inputs: Boost_Cms_Issueto_Cannotgenerateclaimlinks4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ce modèle ne peut pas générer de liens de réclamation car la permission d'affichage est désactivée.`)
};

const ar_boost_cms_issueto_cannotgenerateclaimlinks4 = /** @type {(inputs: Boost_Cms_Issueto_Cannotgenerateclaimlinks4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا يمكن لهذا القالب إنشاء روابط مطالبة لأن إذن العرض معطل.`)
};

/**
* | output |
* | --- |
* | "This template cannot generate claim links because view permission are disabled." |
*
* @param {Boost_Cms_Issueto_Cannotgenerateclaimlinks4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_issueto_cannotgenerateclaimlinks4 = /** @type {((inputs?: Boost_Cms_Issueto_Cannotgenerateclaimlinks4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Issueto_Cannotgenerateclaimlinks4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_issueto_cannotgenerateclaimlinks4(inputs)
	if (locale === "es") return es_boost_cms_issueto_cannotgenerateclaimlinks4(inputs)
	if (locale === "fr") return fr_boost_cms_issueto_cannotgenerateclaimlinks4(inputs)
	return ar_boost_cms_issueto_cannotgenerateclaimlinks4(inputs)
});
export { boost_cms_issueto_cannotgenerateclaimlinks4 as "boost.cms.issueTo.cannotGenerateClaimLinks" }