/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Becomeanapp_Developerprogram3Inputs */

const en_launchpad_becomeanapp_developerprogram3 = /** @type {(inputs: Launchpad_Becomeanapp_Developerprogram3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Developer Program`)
};

const es_launchpad_becomeanapp_developerprogram3 = /** @type {(inputs: Launchpad_Becomeanapp_Developerprogram3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Programa de desarrolladores`)
};

const de_launchpad_becomeanapp_developerprogram3 = /** @type {(inputs: Launchpad_Becomeanapp_Developerprogram3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Entwicklerprogramm`)
};

const ar_launchpad_becomeanapp_developerprogram3 = /** @type {(inputs: Launchpad_Becomeanapp_Developerprogram3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`برنامج المطورين`)
};

const fr_launchpad_becomeanapp_developerprogram3 = /** @type {(inputs: Launchpad_Becomeanapp_Developerprogram3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Programme développeur`)
};

const ko_launchpad_becomeanapp_developerprogram3 = /** @type {(inputs: Launchpad_Becomeanapp_Developerprogram3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`개발자 프로그램`)
};

/**
* | output |
* | --- |
* | "Developer Program" |
*
* @param {Launchpad_Becomeanapp_Developerprogram3Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const launchpad_becomeanapp_developerprogram3 = /** @type {((inputs?: Launchpad_Becomeanapp_Developerprogram3Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Becomeanapp_Developerprogram3Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_becomeanapp_developerprogram3(inputs)
	if (locale === "es") return es_launchpad_becomeanapp_developerprogram3(inputs)
	if (locale === "de") return de_launchpad_becomeanapp_developerprogram3(inputs)
	if (locale === "ar") return ar_launchpad_becomeanapp_developerprogram3(inputs)
	if (locale === "fr") return fr_launchpad_becomeanapp_developerprogram3(inputs)
	return ko_launchpad_becomeanapp_developerprogram3(inputs)
});
export { launchpad_becomeanapp_developerprogram3 as "launchpad.becomeAnApp.developerProgram" }