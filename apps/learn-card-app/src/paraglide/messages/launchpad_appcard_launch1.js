/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Appcard_Launch1Inputs */

const en_launchpad_appcard_launch1 = /** @type {(inputs: Launchpad_Appcard_Launch1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Launch`)
};

const es_launchpad_appcard_launch1 = /** @type {(inputs: Launchpad_Appcard_Launch1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Iniciar`)
};

const de_launchpad_appcard_launch1 = /** @type {(inputs: Launchpad_Appcard_Launch1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Starten`)
};

const ar_launchpad_appcard_launch1 = /** @type {(inputs: Launchpad_Appcard_Launch1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تشغيل`)
};

const fr_launchpad_appcard_launch1 = /** @type {(inputs: Launchpad_Appcard_Launch1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lancer`)
};

const ko_launchpad_appcard_launch1 = /** @type {(inputs: Launchpad_Appcard_Launch1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`실행`)
};

/**
* | output |
* | --- |
* | "Launch" |
*
* @param {Launchpad_Appcard_Launch1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const launchpad_appcard_launch1 = /** @type {((inputs?: Launchpad_Appcard_Launch1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Appcard_Launch1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_appcard_launch1(inputs)
	if (locale === "es") return es_launchpad_appcard_launch1(inputs)
	if (locale === "de") return de_launchpad_appcard_launch1(inputs)
	if (locale === "ar") return ar_launchpad_appcard_launch1(inputs)
	if (locale === "fr") return fr_launchpad_appcard_launch1(inputs)
	return ko_launchpad_appcard_launch1(inputs)
});
export { launchpad_appcard_launch1 as "launchpad.appCard.launch" }