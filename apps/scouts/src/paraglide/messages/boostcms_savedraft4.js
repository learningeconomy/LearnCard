/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Savedraft4Inputs */

const en_boostcms_savedraft4 = /** @type {(inputs: Boostcms_Savedraft4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Save As Draft`)
};

const es_boostcms_savedraft4 = /** @type {(inputs: Boostcms_Savedraft4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guardar como Borrador`)
};

const fr_boostcms_savedraft4 = /** @type {(inputs: Boostcms_Savedraft4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sauvegarder comme brouillon`)
};

const ar_boostcms_savedraft4 = /** @type {(inputs: Boostcms_Savedraft4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Save As Draft`)
};

/**
* | output |
* | --- |
* | "Save As Draft" |
*
* @param {Boostcms_Savedraft4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_savedraft4 = /** @type {((inputs?: Boostcms_Savedraft4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Savedraft4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_savedraft4(inputs)
	if (locale === "es") return es_boostcms_savedraft4(inputs)
	if (locale === "fr") return fr_boostcms_savedraft4(inputs)
	return ar_boostcms_savedraft4(inputs)
});
export { boostcms_savedraft4 as "boostCMS.saveDraft" }