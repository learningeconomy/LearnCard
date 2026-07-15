/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Mediaattachment4Inputs */

const en_boostcms_mediaattachment4 = /** @type {(inputs: Boostcms_Mediaattachment4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Media Attachment`)
};

const es_boostcms_mediaattachment4 = /** @type {(inputs: Boostcms_Mediaattachment4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Adjunto Multimedia`)
};

const fr_boostcms_mediaattachment4 = /** @type {(inputs: Boostcms_Mediaattachment4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pièce jointe multimédia`)
};

const ar_boostcms_mediaattachment4 = /** @type {(inputs: Boostcms_Mediaattachment4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مرفق وسائط`)
};

/**
* | output |
* | --- |
* | "Media Attachment" |
*
* @param {Boostcms_Mediaattachment4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_mediaattachment4 = /** @type {((inputs?: Boostcms_Mediaattachment4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Mediaattachment4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_mediaattachment4(inputs)
	if (locale === "es") return es_boostcms_mediaattachment4(inputs)
	if (locale === "fr") return fr_boostcms_mediaattachment4(inputs)
	return ar_boostcms_mediaattachment4(inputs)
});
export { boostcms_mediaattachment4 as "boostCMS.mediaAttachment" }