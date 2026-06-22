/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Privacy_Showtomembersonly3Inputs */

const en_boost_cms_privacy_showtomembersonly3 = /** @type {(inputs: Boost_Cms_Privacy_Showtomembersonly3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Show to members only`)
};

const es_boost_cms_privacy_showtomembersonly3 = /** @type {(inputs: Boost_Cms_Privacy_Showtomembersonly3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mostrar solo a miembros`)
};

const fr_boost_cms_privacy_showtomembersonly3 = /** @type {(inputs: Boost_Cms_Privacy_Showtomembersonly3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Afficher uniquement aux membres`)
};

const ar_boost_cms_privacy_showtomembersonly3 = /** @type {(inputs: Boost_Cms_Privacy_Showtomembersonly3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عرض للأعضاء فقط`)
};

/**
* | output |
* | --- |
* | "Show to members only" |
*
* @param {Boost_Cms_Privacy_Showtomembersonly3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_privacy_showtomembersonly3 = /** @type {((inputs?: Boost_Cms_Privacy_Showtomembersonly3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Privacy_Showtomembersonly3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_privacy_showtomembersonly3(inputs)
	if (locale === "es") return es_boost_cms_privacy_showtomembersonly3(inputs)
	if (locale === "fr") return fr_boost_cms_privacy_showtomembersonly3(inputs)
	return ar_boost_cms_privacy_showtomembersonly3(inputs)
});
export { boost_cms_privacy_showtomembersonly3 as "boost.cms.privacy.showToMembersOnly" }