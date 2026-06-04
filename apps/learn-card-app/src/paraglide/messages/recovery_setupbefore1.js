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

const de_recovery_setupbefore1 = /** @type {(inputs: Recovery_Setupbefore1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Richte die Wiederherstellung ein, bevor du gehst`)
};

const ar_recovery_setupbefore1 = /** @type {(inputs: Recovery_Setupbefore1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قم بإعداد الاستعادة قبل المغادرة`)
};

const fr_recovery_setupbefore1 = /** @type {(inputs: Recovery_Setupbefore1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configurez la récupération avant de partir`)
};

const ko_recovery_setupbefore1 = /** @type {(inputs: Recovery_Setupbefore1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`떠나기 전에 복구를 설정하세요`)
};

/**
* | output |
* | --- |
* | "Set up recovery before you leave" |
*
* @param {Recovery_Setupbefore1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const recovery_setupbefore1 = /** @type {((inputs?: Recovery_Setupbefore1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setupbefore1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setupbefore1(inputs)
	if (locale === "es") return es_recovery_setupbefore1(inputs)
	if (locale === "de") return de_recovery_setupbefore1(inputs)
	if (locale === "ar") return ar_recovery_setupbefore1(inputs)
	if (locale === "fr") return fr_recovery_setupbefore1(inputs)
	return ko_recovery_setupbefore1(inputs)
});
export { recovery_setupbefore1 as "recovery.setupBefore" }