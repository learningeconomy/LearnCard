/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Scoutsid_Display1Inputs */

const en_scoutsid_display1 = /** @type {(inputs: Scoutsid_Display1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`DISPLAY`)
};

const es_scoutsid_display1 = /** @type {(inputs: Scoutsid_Display1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`MOSTRAR`)
};

const fr_scoutsid_display1 = /** @type {(inputs: Scoutsid_Display1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`AFFICHER`)
};

const ar_scoutsid_display1 = /** @type {(inputs: Scoutsid_Display1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`DISPLAY`)
};

/**
* | output |
* | --- |
* | "DISPLAY" |
*
* @param {Scoutsid_Display1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const scoutsid_display1 = /** @type {((inputs?: Scoutsid_Display1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Scoutsid_Display1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_scoutsid_display1(inputs)
	if (locale === "es") return es_scoutsid_display1(inputs)
	if (locale === "fr") return fr_scoutsid_display1(inputs)
	return ar_scoutsid_display1(inputs)
});
export { scoutsid_display1 as "scoutsId.display" }