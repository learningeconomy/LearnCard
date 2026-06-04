/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Appcard_Connect1Inputs */

const en_launchpad_appcard_connect1 = /** @type {(inputs: Launchpad_Appcard_Connect1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connect`)
};

const es_launchpad_appcard_connect1 = /** @type {(inputs: Launchpad_Appcard_Connect1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Conectar`)
};

const de_launchpad_appcard_connect1 = /** @type {(inputs: Launchpad_Appcard_Connect1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verbinden`)
};

const ar_launchpad_appcard_connect1 = /** @type {(inputs: Launchpad_Appcard_Connect1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اتصال`)
};

const fr_launchpad_appcard_connect1 = /** @type {(inputs: Launchpad_Appcard_Connect1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connecter`)
};

const ko_launchpad_appcard_connect1 = /** @type {(inputs: Launchpad_Appcard_Connect1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`연결`)
};

/**
* | output |
* | --- |
* | "Connect" |
*
* @param {Launchpad_Appcard_Connect1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const launchpad_appcard_connect1 = /** @type {((inputs?: Launchpad_Appcard_Connect1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Appcard_Connect1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_appcard_connect1(inputs)
	if (locale === "es") return es_launchpad_appcard_connect1(inputs)
	if (locale === "de") return de_launchpad_appcard_connect1(inputs)
	if (locale === "ar") return ar_launchpad_appcard_connect1(inputs)
	if (locale === "fr") return fr_launchpad_appcard_connect1(inputs)
	return ko_launchpad_appcard_connect1(inputs)
});
export { launchpad_appcard_connect1 as "launchpad.appCard.connect" }