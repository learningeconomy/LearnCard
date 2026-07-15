/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Issuedok4Inputs */

const en_boostcms_issuedok4 = /** @type {(inputs: Boostcms_Issuedok4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boost issued successfully`)
};

const es_boostcms_issuedok4 = /** @type {(inputs: Boostcms_Issuedok4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boost emitido exitosamente`)
};

const fr_boostcms_issuedok4 = /** @type {(inputs: Boostcms_Issuedok4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boost délivré avec succès`)
};

const ar_boostcms_issuedok4 = /** @type {(inputs: Boostcms_Issuedok4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم إصدار التعزيز بنجاح`)
};

/**
* | output |
* | --- |
* | "Boost issued successfully" |
*
* @param {Boostcms_Issuedok4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_issuedok4 = /** @type {((inputs?: Boostcms_Issuedok4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Issuedok4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_issuedok4(inputs)
	if (locale === "es") return es_boostcms_issuedok4(inputs)
	if (locale === "fr") return fr_boostcms_issuedok4(inputs)
	return ar_boostcms_issuedok4(inputs)
});
export { boostcms_issuedok4 as "boostCMS.issuedOk" }