/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Privacy_Memberdisplay1Inputs */

const en_boost_cms_privacy_memberdisplay1 = /** @type {(inputs: Boost_Cms_Privacy_Memberdisplay1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Member Display`)
};

const es_boost_cms_privacy_memberdisplay1 = /** @type {(inputs: Boost_Cms_Privacy_Memberdisplay1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Visualización de miembros`)
};

const fr_boost_cms_privacy_memberdisplay1 = /** @type {(inputs: Boost_Cms_Privacy_Memberdisplay1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Affichage des membres`)
};

const ar_boost_cms_privacy_memberdisplay1 = /** @type {(inputs: Boost_Cms_Privacy_Memberdisplay1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عرض الأعضاء`)
};

/**
* | output |
* | --- |
* | "Member Display" |
*
* @param {Boost_Cms_Privacy_Memberdisplay1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_privacy_memberdisplay1 = /** @type {((inputs?: Boost_Cms_Privacy_Memberdisplay1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Privacy_Memberdisplay1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_privacy_memberdisplay1(inputs)
	if (locale === "es") return es_boost_cms_privacy_memberdisplay1(inputs)
	if (locale === "fr") return fr_boost_cms_privacy_memberdisplay1(inputs)
	return ar_boost_cms_privacy_memberdisplay1(inputs)
});
export { boost_cms_privacy_memberdisplay1 as "boost.cms.privacy.memberDisplay" }