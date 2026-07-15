/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Scoutsid_Light1Inputs */

const en_scoutsid_light1 = /** @type {(inputs: Scoutsid_Light1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Light`)
};

const es_scoutsid_light1 = /** @type {(inputs: Scoutsid_Light1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Claro`)
};

const fr_scoutsid_light1 = /** @type {(inputs: Scoutsid_Light1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Clair`)
};

const ar_scoutsid_light1 = /** @type {(inputs: Scoutsid_Light1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Light`)
};

/**
* | output |
* | --- |
* | "Light" |
*
* @param {Scoutsid_Light1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const scoutsid_light1 = /** @type {((inputs?: Scoutsid_Light1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Scoutsid_Light1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_scoutsid_light1(inputs)
	if (locale === "es") return es_scoutsid_light1(inputs)
	if (locale === "fr") return fr_scoutsid_light1(inputs)
	return ar_scoutsid_light1(inputs)
});
export { scoutsid_light1 as "scoutsId.light" }