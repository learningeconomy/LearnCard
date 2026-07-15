/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Boostsaved4Inputs */

const en_boostcms_boostsaved4 = /** @type {(inputs: Boostcms_Boostsaved4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boost saved successfully`)
};

const es_boostcms_boostsaved4 = /** @type {(inputs: Boostcms_Boostsaved4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boost guardado exitosamente`)
};

const fr_boostcms_boostsaved4 = /** @type {(inputs: Boostcms_Boostsaved4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boost sauvegardé avec succès`)
};

const ar_boostcms_boostsaved4 = /** @type {(inputs: Boostcms_Boostsaved4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم حفظ التعزيز بنجاح`)
};

/**
* | output |
* | --- |
* | "Boost saved successfully" |
*
* @param {Boostcms_Boostsaved4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_boostsaved4 = /** @type {((inputs?: Boostcms_Boostsaved4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Boostsaved4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_boostsaved4(inputs)
	if (locale === "es") return es_boostcms_boostsaved4(inputs)
	if (locale === "fr") return fr_boostcms_boostsaved4(inputs)
	return ar_boostcms_boostsaved4(inputs)
});
export { boostcms_boostsaved4 as "boostCMS.boostSaved" }