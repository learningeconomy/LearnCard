/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Readypublish4Inputs */

const en_boostcms_readypublish4 = /** @type {(inputs: Boostcms_Readypublish4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Are you ready to publish?`)
};

const es_boostcms_readypublish4 = /** @type {(inputs: Boostcms_Readypublish4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Estás listo para publicar?`)
};

const fr_boostcms_readypublish4 = /** @type {(inputs: Boostcms_Readypublish4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Êtes-vous prêt à publier ?`)
};

const ar_boostcms_readypublish4 = /** @type {(inputs: Boostcms_Readypublish4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Are you ready to publish?`)
};

/**
* | output |
* | --- |
* | "Are you ready to publish?" |
*
* @param {Boostcms_Readypublish4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_readypublish4 = /** @type {((inputs?: Boostcms_Readypublish4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Readypublish4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_readypublish4(inputs)
	if (locale === "es") return es_boostcms_readypublish4(inputs)
	if (locale === "fr") return fr_boostcms_readypublish4(inputs)
	return ar_boostcms_readypublish4(inputs)
});
export { boostcms_readypublish4 as "boostCMS.readyPublish" }