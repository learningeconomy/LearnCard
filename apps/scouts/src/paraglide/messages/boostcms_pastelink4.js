/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Pastelink4Inputs */

const en_boostcms_pastelink4 = /** @type {(inputs: Boostcms_Pastelink4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Paste link...`)
};

const es_boostcms_pastelink4 = /** @type {(inputs: Boostcms_Pastelink4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pegar enlace...`)
};

const fr_boostcms_pastelink4 = /** @type {(inputs: Boostcms_Pastelink4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Coller un lien...`)
};

const ar_boostcms_pastelink4 = /** @type {(inputs: Boostcms_Pastelink4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Paste link...`)
};

/**
* | output |
* | --- |
* | "Paste link..." |
*
* @param {Boostcms_Pastelink4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_pastelink4 = /** @type {((inputs?: Boostcms_Pastelink4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Pastelink4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_pastelink4(inputs)
	if (locale === "es") return es_boostcms_pastelink4(inputs)
	if (locale === "fr") return fr_boostcms_pastelink4(inputs)
	return ar_boostcms_pastelink4(inputs)
});
export { boostcms_pastelink4 as "boostCMS.pasteLink" }