/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Share_Genlink1Inputs */

const en_share_genlink1 = /** @type {(inputs: Share_Genlink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generating Link...`)
};

const es_share_genlink1 = /** @type {(inputs: Share_Genlink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generando Enlace...`)
};

const fr_share_genlink1 = /** @type {(inputs: Share_Genlink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Génération du lien...`)
};

const ar_share_genlink1 = /** @type {(inputs: Share_Genlink1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري إنشاء الرابط...`)
};

/**
* | output |
* | --- |
* | "Generating Link..." |
*
* @param {Share_Genlink1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const share_genlink1 = /** @type {((inputs?: Share_Genlink1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Share_Genlink1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_share_genlink1(inputs)
	if (locale === "es") return es_share_genlink1(inputs)
	if (locale === "fr") return fr_share_genlink1(inputs)
	return ar_share_genlink1(inputs)
});
export { share_genlink1 as "share.genLink" }