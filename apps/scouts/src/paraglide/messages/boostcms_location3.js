/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Location3Inputs */

const en_boostcms_location3 = /** @type {(inputs: Boostcms_Location3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Location`)
};

const es_boostcms_location3 = /** @type {(inputs: Boostcms_Location3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ubicación`)
};

const fr_boostcms_location3 = /** @type {(inputs: Boostcms_Location3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lieu`)
};

const ar_boostcms_location3 = /** @type {(inputs: Boostcms_Location3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الموقع`)
};

/**
* | output |
* | --- |
* | "Location" |
*
* @param {Boostcms_Location3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_location3 = /** @type {((inputs?: Boostcms_Location3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Location3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_location3(inputs)
	if (locale === "es") return es_boostcms_location3(inputs)
	if (locale === "fr") return fr_boostcms_location3(inputs)
	return ar_boostcms_location3(inputs)
});
export { boostcms_location3 as "boostCMS.location" }