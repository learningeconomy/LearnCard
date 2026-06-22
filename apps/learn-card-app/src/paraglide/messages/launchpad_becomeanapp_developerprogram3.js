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

const fr_launchpad_becomeanapp_developerprogram3 = /** @type {(inputs: Launchpad_Becomeanapp_Developerprogram3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Programme développeur`)
};

const ar_launchpad_becomeanapp_developerprogram3 = /** @type {(inputs: Launchpad_Becomeanapp_Developerprogram3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`برنامج المطورين`)
};

/**
* | output |
* | --- |
* | "Developer Program" |
*
* @param {Launchpad_Becomeanapp_Developerprogram3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_becomeanapp_developerprogram3 = /** @type {((inputs?: Launchpad_Becomeanapp_Developerprogram3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Becomeanapp_Developerprogram3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_becomeanapp_developerprogram3(inputs)
	if (locale === "es") return es_launchpad_becomeanapp_developerprogram3(inputs)
	if (locale === "fr") return fr_launchpad_becomeanapp_developerprogram3(inputs)
	return ar_launchpad_becomeanapp_developerprogram3(inputs)
});
export { launchpad_becomeanapp_developerprogram3 as "launchpad.becomeAnApp.developerProgram" }