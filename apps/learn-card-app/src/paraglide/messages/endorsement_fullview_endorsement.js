/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Endorsement_Fullview_EndorsementInputs */

const en_endorsement_fullview_endorsement = /** @type {(inputs: Endorsement_Fullview_EndorsementInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Endorsement`)
};

const es_endorsement_fullview_endorsement = /** @type {(inputs: Endorsement_Fullview_EndorsementInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aval`)
};

const fr_endorsement_fullview_endorsement = /** @type {(inputs: Endorsement_Fullview_EndorsementInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recommandation`)
};

const ar_endorsement_fullview_endorsement = /** @type {(inputs: Endorsement_Fullview_EndorsementInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التوصية`)
};

/**
* | output |
* | --- |
* | "Endorsement" |
*
* @param {Endorsement_Fullview_EndorsementInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_fullview_endorsement = /** @type {((inputs?: Endorsement_Fullview_EndorsementInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Fullview_EndorsementInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_fullview_endorsement(inputs)
	if (locale === "es") return es_endorsement_fullview_endorsement(inputs)
	if (locale === "fr") return fr_endorsement_fullview_endorsement(inputs)
	return ar_endorsement_fullview_endorsement(inputs)
});
export { endorsement_fullview_endorsement as "endorsement.fullview.endorsement" }