/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Confirm_Areyousure2Inputs */

const en_boost_cms_confirm_areyousure2 = /** @type {(inputs: Boost_Cms_Confirm_Areyousure2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Are you sure?`)
};

const es_boost_cms_confirm_areyousure2 = /** @type {(inputs: Boost_Cms_Confirm_Areyousure2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Estás seguro?`)
};

const fr_boost_cms_confirm_areyousure2 = /** @type {(inputs: Boost_Cms_Confirm_Areyousure2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Êtes-vous sûr ?`)
};

const ar_boost_cms_confirm_areyousure2 = /** @type {(inputs: Boost_Cms_Confirm_Areyousure2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هل أنت متأكد؟`)
};

/**
* | output |
* | --- |
* | "Are you sure?" |
*
* @param {Boost_Cms_Confirm_Areyousure2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_confirm_areyousure2 = /** @type {((inputs?: Boost_Cms_Confirm_Areyousure2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Confirm_Areyousure2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_confirm_areyousure2(inputs)
	if (locale === "es") return es_boost_cms_confirm_areyousure2(inputs)
	if (locale === "fr") return fr_boost_cms_confirm_areyousure2(inputs)
	return ar_boost_cms_confirm_areyousure2(inputs)
});
export { boost_cms_confirm_areyousure2 as "boost.cms.confirm.areYouSure" }