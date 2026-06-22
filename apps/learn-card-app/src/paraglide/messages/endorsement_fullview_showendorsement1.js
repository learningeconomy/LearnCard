/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Endorsement_Fullview_Showendorsement1Inputs */

const en_endorsement_fullview_showendorsement1 = /** @type {(inputs: Endorsement_Fullview_Showendorsement1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Show Endorsement?`)
};

const es_endorsement_fullview_showendorsement1 = /** @type {(inputs: Endorsement_Fullview_Showendorsement1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Mostrar aval?`)
};

const fr_endorsement_fullview_showendorsement1 = /** @type {(inputs: Endorsement_Fullview_Showendorsement1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Afficher la recommandation ?`)
};

const ar_endorsement_fullview_showendorsement1 = /** @type {(inputs: Endorsement_Fullview_Showendorsement1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إظهار التوصية؟`)
};

/**
* | output |
* | --- |
* | "Show Endorsement?" |
*
* @param {Endorsement_Fullview_Showendorsement1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_fullview_showendorsement1 = /** @type {((inputs?: Endorsement_Fullview_Showendorsement1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Fullview_Showendorsement1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_fullview_showendorsement1(inputs)
	if (locale === "es") return es_endorsement_fullview_showendorsement1(inputs)
	if (locale === "fr") return fr_endorsement_fullview_showendorsement1(inputs)
	return ar_endorsement_fullview_showendorsement1(inputs)
});
export { endorsement_fullview_showendorsement1 as "endorsement.fullview.showEndorsement" }