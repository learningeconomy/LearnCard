/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Norecipients1Inputs */

const en_boost_norecipients1 = /** @type {(inputs: Boost_Norecipients1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No recipients yet`)
};

const es_boost_norecipients1 = /** @type {(inputs: Boost_Norecipients1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún no hay destinatarios`)
};

const fr_boost_norecipients1 = /** @type {(inputs: Boost_Norecipients1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun destinataire pour le moment`)
};

const ar_boost_norecipients1 = /** @type {(inputs: Boost_Norecipients1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا يوجد مستلمون بعد`)
};

/**
* | output |
* | --- |
* | "No recipients yet" |
*
* @param {Boost_Norecipients1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_norecipients1 = /** @type {((inputs?: Boost_Norecipients1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Norecipients1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_norecipients1(inputs)
	if (locale === "es") return es_boost_norecipients1(inputs)
	if (locale === "fr") return fr_boost_norecipients1(inputs)
	return ar_boost_norecipients1(inputs)
});
export { boost_norecipients1 as "boost.noRecipients" }