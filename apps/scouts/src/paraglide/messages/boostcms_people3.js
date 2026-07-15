/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_People3Inputs */

const en_boostcms_people3 = /** @type {(inputs: Boostcms_People3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`people`)
};

const es_boostcms_people3 = /** @type {(inputs: Boostcms_People3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`personas`)
};

const fr_boostcms_people3 = /** @type {(inputs: Boostcms_People3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`personnes`)
};

const ar_boostcms_people3 = /** @type {(inputs: Boostcms_People3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`people`)
};

/**
* | output |
* | --- |
* | "people" |
*
* @param {Boostcms_People3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_people3 = /** @type {((inputs?: Boostcms_People3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_People3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_people3(inputs)
	if (locale === "es") return es_boostcms_people3(inputs)
	if (locale === "fr") return fr_boostcms_people3(inputs)
	return ar_boostcms_people3(inputs)
});
export { boostcms_people3 as "boostCMS.people" }