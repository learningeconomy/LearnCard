/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Scoutsid_Send1Inputs */

const en_scoutsid_send1 = /** @type {(inputs: Scoutsid_Send1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Send`)
};

const es_scoutsid_send1 = /** @type {(inputs: Scoutsid_Send1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enviar`)
};

const fr_scoutsid_send1 = /** @type {(inputs: Scoutsid_Send1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envoyer`)
};

const ar_scoutsid_send1 = /** @type {(inputs: Scoutsid_Send1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Send`)
};

/**
* | output |
* | --- |
* | "Send" |
*
* @param {Scoutsid_Send1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const scoutsid_send1 = /** @type {((inputs?: Scoutsid_Send1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Scoutsid_Send1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_scoutsid_send1(inputs)
	if (locale === "es") return es_scoutsid_send1(inputs)
	if (locale === "fr") return fr_scoutsid_send1(inputs)
	return ar_scoutsid_send1(inputs)
});
export { scoutsid_send1 as "scoutsId.send" }