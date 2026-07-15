/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Scoutsid_Issueddate2Inputs */

const en_scoutsid_issueddate2 = /** @type {(inputs: Scoutsid_Issueddate2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issued (Date)`)
};

const es_scoutsid_issueddate2 = /** @type {(inputs: Scoutsid_Issueddate2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Emitido (Fecha)`)
};

const fr_scoutsid_issueddate2 = /** @type {(inputs: Scoutsid_Issueddate2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Délivré le (Date)`)
};

const ar_scoutsid_issueddate2 = /** @type {(inputs: Scoutsid_Issueddate2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issued (Date)`)
};

/**
* | output |
* | --- |
* | "Issued (Date)" |
*
* @param {Scoutsid_Issueddate2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const scoutsid_issueddate2 = /** @type {((inputs?: Scoutsid_Issueddate2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Scoutsid_Issueddate2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_scoutsid_issueddate2(inputs)
	if (locale === "es") return es_scoutsid_issueddate2(inputs)
	if (locale === "fr") return fr_scoutsid_issueddate2(inputs)
	return ar_scoutsid_issueddate2(inputs)
});
export { scoutsid_issueddate2 as "scoutsId.issuedDate" }