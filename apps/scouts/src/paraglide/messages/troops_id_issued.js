/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Id_IssuedInputs */

const en_troops_id_issued = /** @type {(inputs: Troops_Id_IssuedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issued {date}`)
};

const es_troops_id_issued = /** @type {(inputs: Troops_Id_IssuedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Emitido {date}`)
};

const fr_troops_id_issued = /** @type {(inputs: Troops_Id_IssuedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Délivré le {date}`)
};

const ar_troops_id_issued = /** @type {(inputs: Troops_Id_IssuedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`صدر {date}`)
};

/**
* | output |
* | --- |
* | "Issued {date}" |
*
* @param {Troops_Id_IssuedInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_id_issued = /** @type {((inputs?: Troops_Id_IssuedInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Id_IssuedInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_id_issued(inputs)
	if (locale === "es") return es_troops_id_issued(inputs)
	if (locale === "fr") return fr_troops_id_issued(inputs)
	return ar_troops_id_issued(inputs)
});
export { troops_id_issued as "troops.id.issued" }