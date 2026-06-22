/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_EndorsementsInputs */

const en_boost_endorsements = /** @type {(inputs: Boost_EndorsementsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Endorsements`)
};

const es_boost_endorsements = /** @type {(inputs: Boost_EndorsementsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Avales`)
};

const fr_boost_endorsements = /** @type {(inputs: Boost_EndorsementsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Recommandations`)
};

const ar_boost_endorsements = /** @type {(inputs: Boost_EndorsementsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التزكيات`)
};

/**
* | output |
* | --- |
* | "Endorsements" |
*
* @param {Boost_EndorsementsInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_endorsements = /** @type {((inputs?: Boost_EndorsementsInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_EndorsementsInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_endorsements(inputs)
	if (locale === "es") return es_boost_endorsements(inputs)
	if (locale === "fr") return fr_boost_endorsements(inputs)
	return ar_boost_endorsements(inputs)
});
export { boost_endorsements as "boost.endorsements" }