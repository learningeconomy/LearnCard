/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Workhistory1Inputs */

const en_boost_workhistory1 = /** @type {(inputs: Boost_Workhistory1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Work History`)
};

const es_boost_workhistory1 = /** @type {(inputs: Boost_Workhistory1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Historial laboral`)
};

const fr_boost_workhistory1 = /** @type {(inputs: Boost_Workhistory1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Historique professionnel`)
};

const ar_boost_workhistory1 = /** @type {(inputs: Boost_Workhistory1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سجل العمل`)
};

/**
* | output |
* | --- |
* | "Work History" |
*
* @param {Boost_Workhistory1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_workhistory1 = /** @type {((inputs?: Boost_Workhistory1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Workhistory1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_workhistory1(inputs)
	if (locale === "es") return es_boost_workhistory1(inputs)
	if (locale === "fr") return fr_boost_workhistory1(inputs)
	return ar_boost_workhistory1(inputs)
});
export { boost_workhistory1 as "boost.workHistory" }