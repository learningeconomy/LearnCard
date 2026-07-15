/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Badgethumbnail4Inputs */

const en_boostcms_badgethumbnail4 = /** @type {(inputs: Boostcms_Badgethumbnail4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Badge Thumbnail`)
};

const es_boostcms_badgethumbnail4 = /** @type {(inputs: Boostcms_Badgethumbnail4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Miniatura de Insignia`)
};

const fr_boostcms_badgethumbnail4 = /** @type {(inputs: Boostcms_Badgethumbnail4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vignette du badge`)
};

const ar_boostcms_badgethumbnail4 = /** @type {(inputs: Boostcms_Badgethumbnail4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Badge Thumbnail`)
};

/**
* | output |
* | --- |
* | "Badge Thumbnail" |
*
* @param {Boostcms_Badgethumbnail4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_badgethumbnail4 = /** @type {((inputs?: Boostcms_Badgethumbnail4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Badgethumbnail4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_badgethumbnail4(inputs)
	if (locale === "es") return es_boostcms_badgethumbnail4(inputs)
	if (locale === "fr") return fr_boostcms_badgethumbnail4(inputs)
	return ar_boostcms_badgethumbnail4(inputs)
});
export { boostcms_badgethumbnail4 as "boostCMS.badgeThumbnail" }