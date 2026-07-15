/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Networkprompts_Settings_Photodesc2Inputs */

const en_networkprompts_settings_photodesc2 = /** @type {(inputs: Networkprompts_Settings_Photodesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your profile photo will appear in your connection’s contact list, but it is never be displayed publicly or shared otherwise without your express permission.`)
};

const es_networkprompts_settings_photodesc2 = /** @type {(inputs: Networkprompts_Settings_Photodesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tu foto aparecerá en la lista de contactos, pero nunca se mostrará públicamente sin tu permiso.`)
};

const fr_networkprompts_settings_photodesc2 = /** @type {(inputs: Networkprompts_Settings_Photodesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Votre photo de profil apparaîtra dans la liste de contacts de vos connexions, mais ne sera jamais affichée publiquement ni partagée sans votre autorisation expresse.`)
};

const ar_networkprompts_settings_photodesc2 = /** @type {(inputs: Networkprompts_Settings_Photodesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ستظهر صورتك الشخصية في قائمة جهات اتصال من تتواصل معهم، لكنها لا تعرض علناً أو تشارك بطريقة أخرى دون موافقتك.`)
};

/**
* | output |
* | --- |
* | "Your profile photo will appear in your connection’s contact list, but it is never be displayed publicly or shared otherwise without your express permission." |
*
* @param {Networkprompts_Settings_Photodesc2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const networkprompts_settings_photodesc2 = /** @type {((inputs?: Networkprompts_Settings_Photodesc2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Networkprompts_Settings_Photodesc2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_networkprompts_settings_photodesc2(inputs)
	if (locale === "es") return es_networkprompts_settings_photodesc2(inputs)
	if (locale === "fr") return fr_networkprompts_settings_photodesc2(inputs)
	return ar_networkprompts_settings_photodesc2(inputs)
});
export { networkprompts_settings_photodesc2 as "networkPrompts.settings.photoDesc" }