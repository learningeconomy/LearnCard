/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Person3Inputs */

const en_boostcms_person3 = /** @type {(inputs: Boostcms_Person3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`person`)
};

const es_boostcms_person3 = /** @type {(inputs: Boostcms_Person3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`persona`)
};

const fr_boostcms_person3 = /** @type {(inputs: Boostcms_Person3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`personne`)
};

const ar_boostcms_person3 = /** @type {(inputs: Boostcms_Person3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`person`)
};

/**
* | output |
* | --- |
* | "person" |
*
* @param {Boostcms_Person3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_person3 = /** @type {((inputs?: Boostcms_Person3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Person3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_person3(inputs)
	if (locale === "es") return es_boostcms_person3(inputs)
	if (locale === "fr") return fr_boostcms_person3(inputs)
	return ar_boostcms_person3(inputs)
});
export { boostcms_person3 as "boostCMS.person" }