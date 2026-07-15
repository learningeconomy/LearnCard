/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_BadgeInputs */

const en_boost_badge = /** @type {(inputs: Boost_BadgeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Badge`)
};

const es_boost_badge = /** @type {(inputs: Boost_BadgeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Insignia`)
};

const fr_boost_badge = /** @type {(inputs: Boost_BadgeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Badge`)
};

const ar_boost_badge = /** @type {(inputs: Boost_BadgeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Badge`)
};

/**
* | output |
* | --- |
* | "Badge" |
*
* @param {Boost_BadgeInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_badge = /** @type {((inputs?: Boost_BadgeInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_BadgeInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_badge(inputs)
	if (locale === "es") return es_boost_badge(inputs)
	if (locale === "fr") return fr_boost_badge(inputs)
	return ar_boost_badge(inputs)
});
export { boost_badge as "boost.badge" }