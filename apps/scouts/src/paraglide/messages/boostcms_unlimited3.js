/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Unlimited3Inputs */

const en_boostcms_unlimited3 = /** @type {(inputs: Boostcms_Unlimited3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unlimited`)
};

const es_boostcms_unlimited3 = /** @type {(inputs: Boostcms_Unlimited3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ilimitado`)
};

const fr_boostcms_unlimited3 = /** @type {(inputs: Boostcms_Unlimited3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Illimité`)
};

const ar_boostcms_unlimited3 = /** @type {(inputs: Boostcms_Unlimited3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unlimited`)
};

/**
* | output |
* | --- |
* | "Unlimited" |
*
* @param {Boostcms_Unlimited3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_unlimited3 = /** @type {((inputs?: Boostcms_Unlimited3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Unlimited3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_unlimited3(inputs)
	if (locale === "es") return es_boostcms_unlimited3(inputs)
	if (locale === "fr") return fr_boostcms_unlimited3(inputs)
	return ar_boostcms_unlimited3(inputs)
});
export { boostcms_unlimited3 as "boostCMS.unlimited" }