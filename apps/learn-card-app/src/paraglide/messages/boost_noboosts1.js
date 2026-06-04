/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Noboosts1Inputs */

const en_boost_noboosts1 = /** @type {(inputs: Boost_Noboosts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No boosts found`)
};

const es_boost_noboosts1 = /** @type {(inputs: Boost_Noboosts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se encontraron boosts`)
};

const de_boost_noboosts1 = /** @type {(inputs: Boost_Noboosts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Keine Boosts gefunden`)
};

const ar_boost_noboosts1 = /** @type {(inputs: Boost_Noboosts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم يتم العثور على ترقيات`)
};

const fr_boost_noboosts1 = /** @type {(inputs: Boost_Noboosts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun boost trouvé`)
};

const ko_boost_noboosts1 = /** @type {(inputs: Boost_Noboosts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`부스트를 찾을 수 없음`)
};

/**
* | output |
* | --- |
* | "No boosts found" |
*
* @param {Boost_Noboosts1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const boost_noboosts1 = /** @type {((inputs?: Boost_Noboosts1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Noboosts1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_noboosts1(inputs)
	if (locale === "es") return es_boost_noboosts1(inputs)
	if (locale === "de") return de_boost_noboosts1(inputs)
	if (locale === "ar") return ar_boost_noboosts1(inputs)
	if (locale === "fr") return fr_boost_noboosts1(inputs)
	return ko_boost_noboosts1(inputs)
});
export { boost_noboosts1 as "boost.noBoosts" }