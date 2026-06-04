/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_DoneInputs */

const en_recovery_done = /** @type {(inputs: Recovery_DoneInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Done`)
};

const es_recovery_done = /** @type {(inputs: Recovery_DoneInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Listo`)
};

const de_recovery_done = /** @type {(inputs: Recovery_DoneInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fertig`)
};

const ar_recovery_done = /** @type {(inputs: Recovery_DoneInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم`)
};

const fr_recovery_done = /** @type {(inputs: Recovery_DoneInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Terminé`)
};

const ko_recovery_done = /** @type {(inputs: Recovery_DoneInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`완료`)
};

/**
* | output |
* | --- |
* | "Done" |
*
* @param {Recovery_DoneInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const recovery_done = /** @type {((inputs?: Recovery_DoneInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_DoneInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_done(inputs)
	if (locale === "es") return es_recovery_done(inputs)
	if (locale === "de") return de_recovery_done(inputs)
	if (locale === "ar") return ar_recovery_done(inputs)
	if (locale === "fr") return fr_recovery_done(inputs)
	return ko_recovery_done(inputs)
});
export { recovery_done as "recovery.done" }