/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Quit3Inputs */

const en_boostcms_quit3 = /** @type {(inputs: Boostcms_Quit3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Quit`)
};

const es_boostcms_quit3 = /** @type {(inputs: Boostcms_Quit3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Salir`)
};

const fr_boostcms_quit3 = /** @type {(inputs: Boostcms_Quit3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Quitter`)
};

const ar_boostcms_quit3 = /** @type {(inputs: Boostcms_Quit3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنهاء`)
};

/**
* | output |
* | --- |
* | "Quit" |
*
* @param {Boostcms_Quit3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_quit3 = /** @type {((inputs?: Boostcms_Quit3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Quit3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_quit3(inputs)
	if (locale === "es") return es_boostcms_quit3(inputs)
	if (locale === "fr") return fr_boostcms_quit3(inputs)
	return ar_boostcms_quit3(inputs)
});
export { boostcms_quit3 as "boostCMS.quit" }