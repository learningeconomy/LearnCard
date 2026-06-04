/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Appcard_Open1Inputs */

const en_launchpad_appcard_open1 = /** @type {(inputs: Launchpad_Appcard_Open1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Open`)
};

const es_launchpad_appcard_open1 = /** @type {(inputs: Launchpad_Appcard_Open1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Abrir`)
};

const de_launchpad_appcard_open1 = /** @type {(inputs: Launchpad_Appcard_Open1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Öffnen`)
};

const ar_launchpad_appcard_open1 = /** @type {(inputs: Launchpad_Appcard_Open1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فتح`)
};

const fr_launchpad_appcard_open1 = /** @type {(inputs: Launchpad_Appcard_Open1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ouvrir`)
};

const ko_launchpad_appcard_open1 = /** @type {(inputs: Launchpad_Appcard_Open1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`열기`)
};

/**
* | output |
* | --- |
* | "Open" |
*
* @param {Launchpad_Appcard_Open1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const launchpad_appcard_open1 = /** @type {((inputs?: Launchpad_Appcard_Open1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Appcard_Open1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_appcard_open1(inputs)
	if (locale === "es") return es_launchpad_appcard_open1(inputs)
	if (locale === "de") return de_launchpad_appcard_open1(inputs)
	if (locale === "ar") return ar_launchpad_appcard_open1(inputs)
	if (locale === "fr") return fr_launchpad_appcard_open1(inputs)
	return ko_launchpad_appcard_open1(inputs)
});
export { launchpad_appcard_open1 as "launchpad.appCard.open" }