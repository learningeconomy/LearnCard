/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillframeworks_Downloadtemplate2Inputs */

const en_skillframeworks_downloadtemplate2 = /** @type {(inputs: Skillframeworks_Downloadtemplate2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Download Blank Template`)
};

const es_skillframeworks_downloadtemplate2 = /** @type {(inputs: Skillframeworks_Downloadtemplate2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Descargar Plantilla en Blanco`)
};

const fr_skillframeworks_downloadtemplate2 = /** @type {(inputs: Skillframeworks_Downloadtemplate2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Télécharger le modèle vierge`)
};

const ar_skillframeworks_downloadtemplate2 = /** @type {(inputs: Skillframeworks_Downloadtemplate2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تنزيل قالب فارغ`)
};

/**
* | output |
* | --- |
* | "Download Blank Template" |
*
* @param {Skillframeworks_Downloadtemplate2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillframeworks_downloadtemplate2 = /** @type {((inputs?: Skillframeworks_Downloadtemplate2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillframeworks_Downloadtemplate2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillframeworks_downloadtemplate2(inputs)
	if (locale === "es") return es_skillframeworks_downloadtemplate2(inputs)
	if (locale === "fr") return fr_skillframeworks_downloadtemplate2(inputs)
	return ar_skillframeworks_downloadtemplate2(inputs)
});
export { skillframeworks_downloadtemplate2 as "skillFrameworks.downloadTemplate" }