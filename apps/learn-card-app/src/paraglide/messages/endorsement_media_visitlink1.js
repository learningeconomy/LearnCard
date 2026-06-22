/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Endorsement_Media_Visitlink1Inputs */

const en_endorsement_media_visitlink1 = /** @type {(inputs: Endorsement_Media_Visitlink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Visit Link`)
};

const es_endorsement_media_visitlink1 = /** @type {(inputs: Endorsement_Media_Visitlink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Visitar enlace`)
};

const fr_endorsement_media_visitlink1 = /** @type {(inputs: Endorsement_Media_Visitlink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ouvrir le lien`)
};

const ar_endorsement_media_visitlink1 = /** @type {(inputs: Endorsement_Media_Visitlink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`زيارة الرابط`)
};

/**
* | output |
* | --- |
* | "Visit Link" |
*
* @param {Endorsement_Media_Visitlink1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_media_visitlink1 = /** @type {((inputs?: Endorsement_Media_Visitlink1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Media_Visitlink1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_media_visitlink1(inputs)
	if (locale === "es") return es_endorsement_media_visitlink1(inputs)
	if (locale === "fr") return fr_endorsement_media_visitlink1(inputs)
	return ar_endorsement_media_visitlink1(inputs)
});
export { endorsement_media_visitlink1 as "endorsement.media.visitLink" }