/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Workhistory_Nohistory2Inputs */

const en_workhistory_nohistory2 = /** @type {(inputs: Workhistory_Nohistory2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No work history yet`)
};

const es_workhistory_nohistory2 = /** @type {(inputs: Workhistory_Nohistory2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún no hay historial laboral`)
};

const fr_workhistory_nohistory2 = /** @type {(inputs: Workhistory_Nohistory2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun historique professionnel`)
};

const ar_workhistory_nohistory2 = /** @type {(inputs: Workhistory_Nohistory2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No work history yet`)
};

/**
* | output |
* | --- |
* | "No work history yet" |
*
* @param {Workhistory_Nohistory2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const workhistory_nohistory2 = /** @type {((inputs?: Workhistory_Nohistory2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Workhistory_Nohistory2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_workhistory_nohistory2(inputs)
	if (locale === "es") return es_workhistory_nohistory2(inputs)
	if (locale === "fr") return fr_workhistory_nohistory2(inputs)
	return ar_workhistory_nohistory2(inputs)
});
export { workhistory_nohistory2 as "workHistory.noHistory" }