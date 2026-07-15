/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Stylepack4Inputs */

const en_boostcms_stylepack4 = /** @type {(inputs: Boostcms_Stylepack4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Style Pack`)
};

const es_boostcms_stylepack4 = /** @type {(inputs: Boostcms_Stylepack4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pack de Estilo`)
};

const fr_boostcms_stylepack4 = /** @type {(inputs: Boostcms_Stylepack4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pack de style`)
};

const ar_boostcms_stylepack4 = /** @type {(inputs: Boostcms_Stylepack4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Style Pack`)
};

/**
* | output |
* | --- |
* | "Style Pack" |
*
* @param {Boostcms_Stylepack4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_stylepack4 = /** @type {((inputs?: Boostcms_Stylepack4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Stylepack4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_stylepack4(inputs)
	if (locale === "es") return es_boostcms_stylepack4(inputs)
	if (locale === "fr") return fr_boostcms_stylepack4(inputs)
	return ar_boostcms_stylepack4(inputs)
});
export { boostcms_stylepack4 as "boostCMS.stylePack" }