/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ type: NonNullable<unknown> }} Endorsement_Media_Attachmenttitle1Inputs */

const en_endorsement_media_attachmenttitle1 = /** @type {(inputs: Endorsement_Media_Attachmenttitle1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.type} Attachment`)
};

const es_endorsement_media_attachmenttitle1 = /** @type {(inputs: Endorsement_Media_Attachmenttitle1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Adjunto de ${i?.type}`)
};

const fr_endorsement_media_attachmenttitle1 = /** @type {(inputs: Endorsement_Media_Attachmenttitle1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Pièce jointe : ${i?.type}`)
};

const ar_endorsement_media_attachmenttitle1 = /** @type {(inputs: Endorsement_Media_Attachmenttitle1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`مرفق ${i?.type}`)
};

/**
* | output |
* | --- |
* | "{type} Attachment" |
*
* @param {Endorsement_Media_Attachmenttitle1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_media_attachmenttitle1 = /** @type {((inputs: Endorsement_Media_Attachmenttitle1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Media_Attachmenttitle1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_media_attachmenttitle1(inputs)
	if (locale === "es") return es_endorsement_media_attachmenttitle1(inputs)
	if (locale === "fr") return fr_endorsement_media_attachmenttitle1(inputs)
	return ar_endorsement_media_attachmenttitle1(inputs)
});
export { endorsement_media_attachmenttitle1 as "endorsement.media.attachmentTitle" }