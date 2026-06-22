/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Setupbefore1Inputs */

const en_recovery_setupbefore1 = /** @type {(inputs: Recovery_Setupbefore1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Set up recovery before you leave`)
};

const es_recovery_setupbefore1 = /** @type {(inputs: Recovery_Setupbefore1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configura la recuperación antes de irte`)
};

const fr_recovery_setupbefore1 = /** @type {(inputs: Recovery_Setupbefore1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configurez la récupération avant de partir`)
};

const ar_recovery_setupbefore1 = /** @type {(inputs: Recovery_Setupbefore1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قم بإعداد الاستعادة قبل المغادرة`)
};

/**
* | output |
* | --- |
* | "Set up recovery before you leave" |
*
* @param {Recovery_Setupbefore1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_setupbefore1 = /** @type {((inputs?: Recovery_Setupbefore1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setupbefore1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setupbefore1(inputs)
	if (locale === "es") return es_recovery_setupbefore1(inputs)
	if (locale === "fr") return fr_recovery_setupbefore1(inputs)
	return ar_recovery_setupbefore1(inputs)
});
export { recovery_setupbefore1 as "recovery.setupBefore" }