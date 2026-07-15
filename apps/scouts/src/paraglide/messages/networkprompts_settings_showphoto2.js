/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Networkprompts_Settings_Showphoto2Inputs */

const en_networkprompts_settings_showphoto2 = /** @type {(inputs: Networkprompts_Settings_Showphoto2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Display profile photo in your connections’ contact lists.`)
};

const es_networkprompts_settings_showphoto2 = /** @type {(inputs: Networkprompts_Settings_Showphoto2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mostrar foto de perfil en las listas de contactos de tus conexiones.`)
};

const fr_networkprompts_settings_showphoto2 = /** @type {(inputs: Networkprompts_Settings_Showphoto2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Afficher la photo de profil dans les listes de contacts de vos connexions.`)
};

const ar_networkprompts_settings_showphoto2 = /** @type {(inputs: Networkprompts_Settings_Showphoto2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Display profile photo in your connections’ contact lists.`)
};

/**
* | output |
* | --- |
* | "Display profile photo in your connections’ contact lists." |
*
* @param {Networkprompts_Settings_Showphoto2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const networkprompts_settings_showphoto2 = /** @type {((inputs?: Networkprompts_Settings_Showphoto2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Networkprompts_Settings_Showphoto2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_networkprompts_settings_showphoto2(inputs)
	if (locale === "es") return es_networkprompts_settings_showphoto2(inputs)
	if (locale === "fr") return fr_networkprompts_settings_showphoto2(inputs)
	return ar_networkprompts_settings_showphoto2(inputs)
});
export { networkprompts_settings_showphoto2 as "networkPrompts.settings.showPhoto" }