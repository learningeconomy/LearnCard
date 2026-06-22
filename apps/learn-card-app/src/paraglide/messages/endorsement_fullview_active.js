/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Endorsement_Fullview_ActiveInputs */

const en_endorsement_fullview_active = /** @type {(inputs: Endorsement_Fullview_ActiveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Active`)
};

const es_endorsement_fullview_active = /** @type {(inputs: Endorsement_Fullview_ActiveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Activo`)
};

const fr_endorsement_fullview_active = /** @type {(inputs: Endorsement_Fullview_ActiveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Actif`)
};

const ar_endorsement_fullview_active = /** @type {(inputs: Endorsement_Fullview_ActiveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نشط`)
};

/**
* | output |
* | --- |
* | "Active" |
*
* @param {Endorsement_Fullview_ActiveInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_fullview_active = /** @type {((inputs?: Endorsement_Fullview_ActiveInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Fullview_ActiveInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_fullview_active(inputs)
	if (locale === "es") return es_endorsement_fullview_active(inputs)
	if (locale === "fr") return fr_endorsement_fullview_active(inputs)
	return ar_endorsement_fullview_active(inputs)
});
export { endorsement_fullview_active as "endorsement.fullview.active" }