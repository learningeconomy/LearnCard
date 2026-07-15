/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Customtype4Inputs */

const en_boostcms_customtype4 = /** @type {(inputs: Boostcms_Customtype4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Custom Type`)
};

const es_boostcms_customtype4 = /** @type {(inputs: Boostcms_Customtype4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tipo Personalizado`)
};

const fr_boostcms_customtype4 = /** @type {(inputs: Boostcms_Customtype4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Type personnalisé`)
};

const ar_boostcms_customtype4 = /** @type {(inputs: Boostcms_Customtype4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نوع مخصص`)
};

/**
* | output |
* | --- |
* | "Custom Type" |
*
* @param {Boostcms_Customtype4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_customtype4 = /** @type {((inputs?: Boostcms_Customtype4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Customtype4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_customtype4(inputs)
	if (locale === "es") return es_boostcms_customtype4(inputs)
	if (locale === "fr") return fr_boostcms_customtype4(inputs)
	return ar_boostcms_customtype4(inputs)
});
export { boostcms_customtype4 as "boostCMS.customType" }