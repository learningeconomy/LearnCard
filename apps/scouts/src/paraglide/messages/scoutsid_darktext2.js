/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Scoutsid_Darktext2Inputs */

const en_scoutsid_darktext2 = /** @type {(inputs: Scoutsid_Darktext2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Dark Text`)
};

const es_scoutsid_darktext2 = /** @type {(inputs: Scoutsid_Darktext2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Texto Oscuro`)
};

const fr_scoutsid_darktext2 = /** @type {(inputs: Scoutsid_Darktext2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Texte foncé`)
};

const ar_scoutsid_darktext2 = /** @type {(inputs: Scoutsid_Darktext2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Dark Text`)
};

/**
* | output |
* | --- |
* | "Dark Text" |
*
* @param {Scoutsid_Darktext2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const scoutsid_darktext2 = /** @type {((inputs?: Scoutsid_Darktext2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Scoutsid_Darktext2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_scoutsid_darktext2(inputs)
	if (locale === "es") return es_scoutsid_darktext2(inputs)
	if (locale === "fr") return fr_scoutsid_darktext2(inputs)
	return ar_scoutsid_darktext2(inputs)
});
export { scoutsid_darktext2 as "scoutsId.darkText" }