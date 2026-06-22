/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Manageboost1Inputs */

const en_boost_manageboost1 = /** @type {(inputs: Boost_Manageboost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Manage`)
};

const es_boost_manageboost1 = /** @type {(inputs: Boost_Manageboost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gestionar`)
};

const fr_boost_manageboost1 = /** @type {(inputs: Boost_Manageboost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Gérer`)
};

const ar_boost_manageboost1 = /** @type {(inputs: Boost_Manageboost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إدارة`)
};

/**
* | output |
* | --- |
* | "Manage" |
*
* @param {Boost_Manageboost1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_manageboost1 = /** @type {((inputs?: Boost_Manageboost1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Manageboost1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_manageboost1(inputs)
	if (locale === "es") return es_boost_manageboost1(inputs)
	if (locale === "fr") return fr_boost_manageboost1(inputs)
	return ar_boost_manageboost1(inputs)
});
export { boost_manageboost1 as "boost.manageBoost" }