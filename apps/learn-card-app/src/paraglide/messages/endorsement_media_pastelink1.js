/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Endorsement_Media_Pastelink1Inputs */

const en_endorsement_media_pastelink1 = /** @type {(inputs: Endorsement_Media_Pastelink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Paste link...`)
};

const es_endorsement_media_pastelink1 = /** @type {(inputs: Endorsement_Media_Pastelink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pega el enlace...`)
};

const fr_endorsement_media_pastelink1 = /** @type {(inputs: Endorsement_Media_Pastelink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Collez le lien...`)
};

const ar_endorsement_media_pastelink1 = /** @type {(inputs: Endorsement_Media_Pastelink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الصق الرابط...`)
};

/**
* | output |
* | --- |
* | "Paste link..." |
*
* @param {Endorsement_Media_Pastelink1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_media_pastelink1 = /** @type {((inputs?: Endorsement_Media_Pastelink1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Media_Pastelink1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_media_pastelink1(inputs)
	if (locale === "es") return es_endorsement_media_pastelink1(inputs)
	if (locale === "fr") return fr_endorsement_media_pastelink1(inputs)
	return ar_endorsement_media_pastelink1(inputs)
});
export { endorsement_media_pastelink1 as "endorsement.media.pasteLink" }