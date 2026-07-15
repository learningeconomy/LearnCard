/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Uploading3Inputs */

const en_boostcms_uploading3 = /** @type {(inputs: Boostcms_Uploading3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Uploading...`)
};

const es_boostcms_uploading3 = /** @type {(inputs: Boostcms_Uploading3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Subiendo...`)
};

const fr_boostcms_uploading3 = /** @type {(inputs: Boostcms_Uploading3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Téléchargement en cours...`)
};

const ar_boostcms_uploading3 = /** @type {(inputs: Boostcms_Uploading3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري الرفع...`)
};

/**
* | output |
* | --- |
* | "Uploading..." |
*
* @param {Boostcms_Uploading3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_uploading3 = /** @type {((inputs?: Boostcms_Uploading3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Uploading3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_uploading3(inputs)
	if (locale === "es") return es_boostcms_uploading3(inputs)
	if (locale === "fr") return fr_boostcms_uploading3(inputs)
	return ar_boostcms_uploading3(inputs)
});
export { boostcms_uploading3 as "boostCMS.uploading" }