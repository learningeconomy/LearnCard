/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Viewboost4Inputs */

const en_boostcms_viewboost4 = /** @type {(inputs: Boostcms_Viewboost4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`View Boost`)
};

const es_boostcms_viewboost4 = /** @type {(inputs: Boostcms_Viewboost4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ver Boost`)
};

const fr_boostcms_viewboost4 = /** @type {(inputs: Boostcms_Viewboost4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Voir le Boost`)
};

const ar_boostcms_viewboost4 = /** @type {(inputs: Boostcms_Viewboost4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عرض التعزيز`)
};

/**
* | output |
* | --- |
* | "View Boost" |
*
* @param {Boostcms_Viewboost4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_viewboost4 = /** @type {((inputs?: Boostcms_Viewboost4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Viewboost4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_viewboost4(inputs)
	if (locale === "es") return es_boostcms_viewboost4(inputs)
	if (locale === "fr") return fr_boostcms_viewboost4(inputs)
	return ar_boostcms_viewboost4(inputs)
});
export { boostcms_viewboost4 as "boostCMS.viewBoost" }