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

const fr_launchpad_becomeanapp_buildyourownapp5 = /** @type {(inputs: Launchpad_Becomeanapp_Buildyourownapp5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créez votre propre application`)
};

const ar_launchpad_becomeanapp_buildyourownapp5 = /** @type {(inputs: Launchpad_Becomeanapp_Buildyourownapp5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أنشئ تطبيقك الخاص`)
};

/**
* | output |
* | --- |
* | "Build Your Own App" |
*
* @param {Launchpad_Becomeanapp_Buildyourownapp5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_becomeanapp_buildyourownapp5 = /** @type {((inputs?: Launchpad_Becomeanapp_Buildyourownapp5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Becomeanapp_Buildyourownapp5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_becomeanapp_buildyourownapp5(inputs)
	if (locale === "es") return es_launchpad_becomeanapp_buildyourownapp5(inputs)
	if (locale === "fr") return fr_launchpad_becomeanapp_buildyourownapp5(inputs)
	return ar_launchpad_becomeanapp_buildyourownapp5(inputs)
});
export { launchpad_becomeanapp_buildyourownapp5 as "launchpad.becomeAnApp.buildYourOwnApp" }