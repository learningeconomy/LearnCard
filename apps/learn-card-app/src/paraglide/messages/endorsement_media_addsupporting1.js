/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Endorsement_Media_Addsupporting1Inputs */

const en_endorsement_media_addsupporting1 = /** @type {(inputs: Endorsement_Media_Addsupporting1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add Supporting Media`)
};

const es_endorsement_media_addsupporting1 = /** @type {(inputs: Endorsement_Media_Addsupporting1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Añadir material de apoyo`)
};

const fr_endorsement_media_addsupporting1 = /** @type {(inputs: Endorsement_Media_Addsupporting1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter un média à l'appui`)
};

const ar_endorsement_media_addsupporting1 = /** @type {(inputs: Endorsement_Media_Addsupporting1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إضافة وسائط داعمة`)
};

/**
* | output |
* | --- |
* | "Add Supporting Media" |
*
* @param {Endorsement_Media_Addsupporting1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_media_addsupporting1 = /** @type {((inputs?: Endorsement_Media_Addsupporting1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Media_Addsupporting1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_media_addsupporting1(inputs)
	if (locale === "es") return es_endorsement_media_addsupporting1(inputs)
	if (locale === "fr") return fr_endorsement_media_addsupporting1(inputs)
	return ar_endorsement_media_addsupporting1(inputs)
});
export { endorsement_media_addsupporting1 as "endorsement.media.addSupporting" }