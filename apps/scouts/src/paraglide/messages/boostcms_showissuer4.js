/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Showissuer4Inputs */

const en_boostcms_showissuer4 = /** @type {(inputs: Boostcms_Showissuer4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Show Issuer Thumbnail`)
};

const es_boostcms_showissuer4 = /** @type {(inputs: Boostcms_Showissuer4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mostrar Miniatura del Emisor`)
};

const fr_boostcms_showissuer4 = /** @type {(inputs: Boostcms_Showissuer4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Afficher la vignette de l'émetteur`)
};

const ar_boostcms_showissuer4 = /** @type {(inputs: Boostcms_Showissuer4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إظهار صورة المُصدر المصغرة`)
};

/**
* | output |
* | --- |
* | "Show Issuer Thumbnail" |
*
* @param {Boostcms_Showissuer4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_showissuer4 = /** @type {((inputs?: Boostcms_Showissuer4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Showissuer4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_showissuer4(inputs)
	if (locale === "es") return es_boostcms_showissuer4(inputs)
	if (locale === "fr") return fr_boostcms_showissuer4(inputs)
	return ar_boostcms_showissuer4(inputs)
});
export { boostcms_showissuer4 as "boostCMS.showIssuer" }