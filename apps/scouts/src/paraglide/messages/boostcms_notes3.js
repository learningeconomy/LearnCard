/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Notes3Inputs */

const en_boostcms_notes3 = /** @type {(inputs: Boostcms_Notes3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Notes`)
};

const es_boostcms_notes3 = /** @type {(inputs: Boostcms_Notes3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Notas`)
};

const fr_boostcms_notes3 = /** @type {(inputs: Boostcms_Notes3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Notes`)
};

const ar_boostcms_notes3 = /** @type {(inputs: Boostcms_Notes3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ملاحظات`)
};

/**
* | output |
* | --- |
* | "Notes" |
*
* @param {Boostcms_Notes3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_notes3 = /** @type {((inputs?: Boostcms_Notes3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Notes3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_notes3(inputs)
	if (locale === "es") return es_boostcms_notes3(inputs)
	if (locale === "fr") return fr_boostcms_notes3(inputs)
	return ar_boostcms_notes3(inputs)
});
export { boostcms_notes3 as "boostCMS.notes" }