/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Becomeanapp_Buildyourownapp5Inputs */

const en_launchpad_becomeanapp_buildyourownapp5 = /** @type {(inputs: Launchpad_Becomeanapp_Buildyourownapp5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Build Your Own App`)
};

const es_launchpad_becomeanapp_buildyourownapp5 = /** @type {(inputs: Launchpad_Becomeanapp_Buildyourownapp5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crea tu propia app`)
};

const de_launchpad_becomeanapp_buildyourownapp5 = /** @type {(inputs: Launchpad_Becomeanapp_Buildyourownapp5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Erstelle deine eigene App`)
};

const ar_launchpad_becomeanapp_buildyourownapp5 = /** @type {(inputs: Launchpad_Becomeanapp_Buildyourownapp5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أنشئ تطبيقك الخاص`)
};

const fr_launchpad_becomeanapp_buildyourownapp5 = /** @type {(inputs: Launchpad_Becomeanapp_Buildyourownapp5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créez votre propre application`)
};

const ko_launchpad_becomeanapp_buildyourownapp5 = /** @type {(inputs: Launchpad_Becomeanapp_Buildyourownapp5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`나만의 앱 만들기`)
};

/**
* | output |
* | --- |
* | "Build Your Own App" |
*
* @param {Launchpad_Becomeanapp_Buildyourownapp5Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const launchpad_becomeanapp_buildyourownapp5 = /** @type {((inputs?: Launchpad_Becomeanapp_Buildyourownapp5Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Becomeanapp_Buildyourownapp5Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_becomeanapp_buildyourownapp5(inputs)
	if (locale === "es") return es_launchpad_becomeanapp_buildyourownapp5(inputs)
	if (locale === "de") return de_launchpad_becomeanapp_buildyourownapp5(inputs)
	if (locale === "ar") return ar_launchpad_becomeanapp_buildyourownapp5(inputs)
	if (locale === "fr") return fr_launchpad_becomeanapp_buildyourownapp5(inputs)
	return ko_launchpad_becomeanapp_buildyourownapp5(inputs)
});
export { launchpad_becomeanapp_buildyourownapp5 as "launchpad.becomeAnApp.buildYourOwnApp" }