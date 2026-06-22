/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Endorsement_Fullview_Supportingmedia1Inputs */

const en_endorsement_fullview_supportingmedia1 = /** @type {(inputs: Endorsement_Fullview_Supportingmedia1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Supporting Media`)
};

const es_endorsement_fullview_supportingmedia1 = /** @type {(inputs: Endorsement_Fullview_Supportingmedia1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Material de apoyo`)
};

const fr_endorsement_fullview_supportingmedia1 = /** @type {(inputs: Endorsement_Fullview_Supportingmedia1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Médias à l'appui`)
};

const ar_endorsement_fullview_supportingmedia1 = /** @type {(inputs: Endorsement_Fullview_Supportingmedia1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الوسائط الداعمة`)
};

/**
* | output |
* | --- |
* | "Supporting Media" |
*
* @param {Endorsement_Fullview_Supportingmedia1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_fullview_supportingmedia1 = /** @type {((inputs?: Endorsement_Fullview_Supportingmedia1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Fullview_Supportingmedia1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_fullview_supportingmedia1(inputs)
	if (locale === "es") return es_endorsement_fullview_supportingmedia1(inputs)
	if (locale === "fr") return fr_endorsement_fullview_supportingmedia1(inputs)
	return ar_endorsement_fullview_supportingmedia1(inputs)
});
export { endorsement_fullview_supportingmedia1 as "endorsement.fullview.supportingMedia" }