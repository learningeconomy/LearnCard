/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Endorsement_Fullview_HiddenInputs */

const en_endorsement_fullview_hidden = /** @type {(inputs: Endorsement_Fullview_HiddenInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Hidden`)
};

const es_endorsement_fullview_hidden = /** @type {(inputs: Endorsement_Fullview_HiddenInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Oculto`)
};

const fr_endorsement_fullview_hidden = /** @type {(inputs: Endorsement_Fullview_HiddenInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Masqué`)
};

const ar_endorsement_fullview_hidden = /** @type {(inputs: Endorsement_Fullview_HiddenInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مخفي`)
};

/**
* | output |
* | --- |
* | "Hidden" |
*
* @param {Endorsement_Fullview_HiddenInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_fullview_hidden = /** @type {((inputs?: Endorsement_Fullview_HiddenInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Fullview_HiddenInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_fullview_hidden(inputs)
	if (locale === "es") return es_endorsement_fullview_hidden(inputs)
	if (locale === "fr") return fr_endorsement_fullview_hidden(inputs)
	return ar_endorsement_fullview_hidden(inputs)
});
export { endorsement_fullview_hidden as "endorsement.fullview.hidden" }