/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Appearance_Badgethumbnailalt2Inputs */

const en_boost_cms_appearance_badgethumbnailalt2 = /** @type {(inputs: Boost_Cms_Appearance_Badgethumbnailalt2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`badge thumbnail`)
};

const es_boost_cms_appearance_badgethumbnailalt2 = /** @type {(inputs: Boost_Cms_Appearance_Badgethumbnailalt2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`miniatura de la insignia`)
};

const fr_boost_cms_appearance_badgethumbnailalt2 = /** @type {(inputs: Boost_Cms_Appearance_Badgethumbnailalt2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`vignette du badge`)
};

const ar_boost_cms_appearance_badgethumbnailalt2 = /** @type {(inputs: Boost_Cms_Appearance_Badgethumbnailalt2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`صورة الشارة المصغرة`)
};

/**
* | output |
* | --- |
* | "badge thumbnail" |
*
* @param {Boost_Cms_Appearance_Badgethumbnailalt2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_appearance_badgethumbnailalt2 = /** @type {((inputs?: Boost_Cms_Appearance_Badgethumbnailalt2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Appearance_Badgethumbnailalt2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_appearance_badgethumbnailalt2(inputs)
	if (locale === "es") return es_boost_cms_appearance_badgethumbnailalt2(inputs)
	if (locale === "fr") return fr_boost_cms_appearance_badgethumbnailalt2(inputs)
	return ar_boost_cms_appearance_badgethumbnailalt2(inputs)
});
export { boost_cms_appearance_badgethumbnailalt2 as "boost.cms.appearance.badgeThumbnailAlt" }