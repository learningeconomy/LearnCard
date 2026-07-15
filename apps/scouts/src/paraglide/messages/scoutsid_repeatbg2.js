/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Scoutsid_Repeatbg2Inputs */

const en_scoutsid_repeatbg2 = /** @type {(inputs: Scoutsid_Repeatbg2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Repeat background`)
};

const es_scoutsid_repeatbg2 = /** @type {(inputs: Scoutsid_Repeatbg2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Repetir fondo`)
};

const fr_scoutsid_repeatbg2 = /** @type {(inputs: Scoutsid_Repeatbg2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Répéter l'arrière-plan`)
};

const ar_scoutsid_repeatbg2 = /** @type {(inputs: Scoutsid_Repeatbg2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Repeat background`)
};

/**
* | output |
* | --- |
* | "Repeat background" |
*
* @param {Scoutsid_Repeatbg2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const scoutsid_repeatbg2 = /** @type {((inputs?: Scoutsid_Repeatbg2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Scoutsid_Repeatbg2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_scoutsid_repeatbg2(inputs)
	if (locale === "es") return es_scoutsid_repeatbg2(inputs)
	if (locale === "fr") return fr_scoutsid_repeatbg2(inputs)
	return ar_scoutsid_repeatbg2(inputs)
});
export { scoutsid_repeatbg2 as "scoutsId.repeatBg" }