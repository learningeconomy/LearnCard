/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Endorsement_Media_Titleplaceholder1Inputs */

const en_endorsement_media_titleplaceholder1 = /** @type {(inputs: Endorsement_Media_Titleplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Title`)
};

const es_endorsement_media_titleplaceholder1 = /** @type {(inputs: Endorsement_Media_Titleplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Título`)
};

const fr_endorsement_media_titleplaceholder1 = /** @type {(inputs: Endorsement_Media_Titleplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Titre`)
};

const ar_endorsement_media_titleplaceholder1 = /** @type {(inputs: Endorsement_Media_Titleplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`العنوان`)
};

/**
* | output |
* | --- |
* | "Title" |
*
* @param {Endorsement_Media_Titleplaceholder1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_media_titleplaceholder1 = /** @type {((inputs?: Endorsement_Media_Titleplaceholder1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Media_Titleplaceholder1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_media_titleplaceholder1(inputs)
	if (locale === "es") return es_endorsement_media_titleplaceholder1(inputs)
	if (locale === "fr") return fr_endorsement_media_titleplaceholder1(inputs)
	return ar_endorsement_media_titleplaceholder1(inputs)
});
export { endorsement_media_titleplaceholder1 as "endorsement.media.titlePlaceholder" }