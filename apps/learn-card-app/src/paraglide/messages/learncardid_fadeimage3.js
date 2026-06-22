/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Learncardid_Fadeimage3Inputs */

const en_learncardid_fadeimage3 = /** @type {(inputs: Learncardid_Fadeimage3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fade Image`)
};

const es_learncardid_fadeimage3 = /** @type {(inputs: Learncardid_Fadeimage3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Atenuar imagen`)
};

const fr_learncardid_fadeimage3 = /** @type {(inputs: Learncardid_Fadeimage3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Estomper l’image`)
};

const ar_learncardid_fadeimage3 = /** @type {(inputs: Learncardid_Fadeimage3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعتيم الصورة`)
};

/**
* | output |
* | --- |
* | "Fade Image" |
*
* @param {Learncardid_Fadeimage3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const learncardid_fadeimage3 = /** @type {((inputs?: Learncardid_Fadeimage3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Learncardid_Fadeimage3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_learncardid_fadeimage3(inputs)
	if (locale === "es") return es_learncardid_fadeimage3(inputs)
	if (locale === "fr") return fr_learncardid_fadeimage3(inputs)
	return ar_learncardid_fadeimage3(inputs)
});
export { learncardid_fadeimage3 as "learnCardId.fadeImage" }