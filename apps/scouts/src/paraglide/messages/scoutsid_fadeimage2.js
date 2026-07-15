/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Scoutsid_Fadeimage2Inputs */

const en_scoutsid_fadeimage2 = /** @type {(inputs: Scoutsid_Fadeimage2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fade Image`)
};

const es_scoutsid_fadeimage2 = /** @type {(inputs: Scoutsid_Fadeimage2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Desvanecer Imagen`)
};

const fr_scoutsid_fadeimage2 = /** @type {(inputs: Scoutsid_Fadeimage2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Image fondue`)
};

const ar_scoutsid_fadeimage2 = /** @type {(inputs: Scoutsid_Fadeimage2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعتيم الصورة`)
};

/**
* | output |
* | --- |
* | "Fade Image" |
*
* @param {Scoutsid_Fadeimage2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const scoutsid_fadeimage2 = /** @type {((inputs?: Scoutsid_Fadeimage2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Scoutsid_Fadeimage2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_scoutsid_fadeimage2(inputs)
	if (locale === "es") return es_scoutsid_fadeimage2(inputs)
	if (locale === "fr") return fr_scoutsid_fadeimage2(inputs)
	return ar_scoutsid_fadeimage2(inputs)
});
export { scoutsid_fadeimage2 as "scoutsId.fadeImage" }