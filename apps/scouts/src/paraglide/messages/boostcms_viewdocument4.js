/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Viewdocument4Inputs */

const en_boostcms_viewdocument4 = /** @type {(inputs: Boostcms_Viewdocument4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`View Document`)
};

const es_boostcms_viewdocument4 = /** @type {(inputs: Boostcms_Viewdocument4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ver Documento`)
};

const fr_boostcms_viewdocument4 = /** @type {(inputs: Boostcms_Viewdocument4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Voir le document`)
};

const ar_boostcms_viewdocument4 = /** @type {(inputs: Boostcms_Viewdocument4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عرض المستند`)
};

/**
* | output |
* | --- |
* | "View Document" |
*
* @param {Boostcms_Viewdocument4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_viewdocument4 = /** @type {((inputs?: Boostcms_Viewdocument4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Viewdocument4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_viewdocument4(inputs)
	if (locale === "es") return es_boostcms_viewdocument4(inputs)
	if (locale === "fr") return fr_boostcms_viewdocument4(inputs)
	return ar_boostcms_viewdocument4(inputs)
});
export { boostcms_viewdocument4 as "boostCMS.viewDocument" }