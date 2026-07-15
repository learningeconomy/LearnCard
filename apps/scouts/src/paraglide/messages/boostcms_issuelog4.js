/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Issuelog4Inputs */

const en_boostcms_issuelog4 = /** @type {(inputs: Boostcms_Issuelog4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issue Log`)
};

const es_boostcms_issuelog4 = /** @type {(inputs: Boostcms_Issuelog4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Registro de Emisión`)
};

const fr_boostcms_issuelog4 = /** @type {(inputs: Boostcms_Issuelog4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Journal de délivrance`)
};

const ar_boostcms_issuelog4 = /** @type {(inputs: Boostcms_Issuelog4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سجل الإصدار`)
};

/**
* | output |
* | --- |
* | "Issue Log" |
*
* @param {Boostcms_Issuelog4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_issuelog4 = /** @type {((inputs?: Boostcms_Issuelog4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Issuelog4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_issuelog4(inputs)
	if (locale === "es") return es_boostcms_issuelog4(inputs)
	if (locale === "fr") return fr_boostcms_issuelog4(inputs)
	return ar_boostcms_issuelog4(inputs)
});
export { boostcms_issuelog4 as "boostCMS.issueLog" }