/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Appearance_Badgethumbnail1Inputs */

const en_boost_cms_appearance_badgethumbnail1 = /** @type {(inputs: Boost_Cms_Appearance_Badgethumbnail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Badge Thumbnail`)
};

const es_boost_cms_appearance_badgethumbnail1 = /** @type {(inputs: Boost_Cms_Appearance_Badgethumbnail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Miniatura de la insignia`)
};

const fr_boost_cms_appearance_badgethumbnail1 = /** @type {(inputs: Boost_Cms_Appearance_Badgethumbnail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vignette du badge`)
};

const ar_boost_cms_appearance_badgethumbnail1 = /** @type {(inputs: Boost_Cms_Appearance_Badgethumbnail1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`صورة الشارة المصغرة`)
};

/**
* | output |
* | --- |
* | "Badge Thumbnail" |
*
* @param {Boost_Cms_Appearance_Badgethumbnail1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_appearance_badgethumbnail1 = /** @type {((inputs?: Boost_Cms_Appearance_Badgethumbnail1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Appearance_Badgethumbnail1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_appearance_badgethumbnail1(inputs)
	if (locale === "es") return es_boost_cms_appearance_badgethumbnail1(inputs)
	if (locale === "fr") return fr_boost_cms_appearance_badgethumbnail1(inputs)
	return ar_boost_cms_appearance_badgethumbnail1(inputs)
});
export { boost_cms_appearance_badgethumbnail1 as "boost.cms.appearance.badgeThumbnail" }