/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_CopiedInputs */

const en_toasts_copied = /** @type {(inputs: Toasts_CopiedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copied to clipboard`)
};

const es_toasts_copied = /** @type {(inputs: Toasts_CopiedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copiado al portapapeles`)
};

const de_toasts_copied = /** @type {(inputs: Toasts_CopiedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`In die Zwischenablage kopiert`)
};

const ar_toasts_copied = /** @type {(inputs: Toasts_CopiedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم النسخ إلى الحافظة`)
};

const fr_toasts_copied = /** @type {(inputs: Toasts_CopiedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copié dans le presse-papiers`)
};

const ko_toasts_copied = /** @type {(inputs: Toasts_CopiedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`클립보드에 복사됨`)
};

/**
* | output |
* | --- |
* | "Copied to clipboard" |
*
* @param {Toasts_CopiedInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const toasts_copied = /** @type {((inputs?: Toasts_CopiedInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_CopiedInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_copied(inputs)
	if (locale === "es") return es_toasts_copied(inputs)
	if (locale === "de") return de_toasts_copied(inputs)
	if (locale === "ar") return ar_toasts_copied(inputs)
	if (locale === "fr") return fr_toasts_copied(inputs)
	return ko_toasts_copied(inputs)
});
export { toasts_copied as "toasts.copied" }