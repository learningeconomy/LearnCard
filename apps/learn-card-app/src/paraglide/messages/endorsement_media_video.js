/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Endorsement_Media_VideoInputs */

const en_endorsement_media_video = /** @type {(inputs: Endorsement_Media_VideoInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Video`)
};

const es_endorsement_media_video = /** @type {(inputs: Endorsement_Media_VideoInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Video`)
};

const fr_endorsement_media_video = /** @type {(inputs: Endorsement_Media_VideoInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vidéo`)
};

const ar_endorsement_media_video = /** @type {(inputs: Endorsement_Media_VideoInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فيديو`)
};

/**
* | output |
* | --- |
* | "Video" |
*
* @param {Endorsement_Media_VideoInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_media_video = /** @type {((inputs?: Endorsement_Media_VideoInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Media_VideoInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_media_video(inputs)
	if (locale === "es") return es_endorsement_media_video(inputs)
	if (locale === "fr") return fr_endorsement_media_video(inputs)
	return ar_endorsement_media_video(inputs)
});
export { endorsement_media_video as "endorsement.media.video" }