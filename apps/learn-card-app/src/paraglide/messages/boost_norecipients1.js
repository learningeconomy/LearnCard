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

const de_boost_norecipients1 = /** @type {(inputs: Boost_Norecipients1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Noch keine Empfänger`)
};

const ar_boost_norecipients1 = /** @type {(inputs: Boost_Norecipients1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا يوجد مستلمون بعد`)
};

const fr_boost_norecipients1 = /** @type {(inputs: Boost_Norecipients1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun destinataire pour le moment`)
};

const ko_boost_norecipients1 = /** @type {(inputs: Boost_Norecipients1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`아직 수령인 없음`)
};

/**
* | output |
* | --- |
* | "No recipients yet" |
*
* @param {Boost_Norecipients1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const boost_norecipients1 = /** @type {((inputs?: Boost_Norecipients1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Norecipients1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_norecipients1(inputs)
	if (locale === "es") return es_boost_norecipients1(inputs)
	if (locale === "de") return de_boost_norecipients1(inputs)
	if (locale === "ar") return ar_boost_norecipients1(inputs)
	if (locale === "fr") return fr_boost_norecipients1(inputs)
	return ko_boost_norecipients1(inputs)
});
export { boost_norecipients1 as "boost.noRecipients" }